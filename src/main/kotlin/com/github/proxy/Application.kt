package com.github.proxy

import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.routing.*
import io.ktor.server.response.*
import io.ktor.server.request.*
import io.ktor.http.*
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.plugins.contentnegotiation.*
import kotlinx.serialization.json.Json

fun main() {
    embeddedServer(Netty, port = System.getenv("PORT")?.toInt() ?: 8080, host = "0.0.0.0") {
        module()
    }.start(wait = true)
}

fun Application.module() {
    // 配置 CORS
    install(CORS) {
        anyHost()
        allowHeader(HttpHeaders.Authorization)
        allowHeader(HttpHeaders.ContentType)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Options)
    }

    // 配置 JSON 序列化
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
        })
    }

    // 配置错误处理
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            call.respondText(
                text = "500: ${cause.message}",
                status = HttpStatusCode.InternalServerError
            )
        }
    }

    // 创建 HTTP 客户端
    val client = HttpClient(CIO)

    // 配置路由
    routing {
        // 根路由
        get("/") {
            call.respond(mapOf(
                "status" to "ok",
                "version" to "1.0.1",
                "message" to "GitHub API Proxy is running",
                "endpoints" to listOf(
                    "/health",
                    "/api/contents/{path}",
                    "/api/commits/{path}"
                )
            ))
        }

        // 健康检查端点
        get("/health") {
            call.respond(mapOf("status" to "ok"))
        }

        // GitHub API 代理
        get("/api/contents/{...}") {
            val path = call.parameters["..."] ?: ""
            val githubToken = System.getenv("GITHUB_TOKEN")
            
            if (githubToken.isNullOrEmpty()) {
                call.respondText(
                    text = "Error: GitHub token not configured",
                    status = HttpStatusCode.InternalServerError
                )
                return@get
            }

            val repoOwner = "android-greenhand"
            val repoName = "Logseq"

            try {
                val response = client.get("https://api.github.com/repos/$repoOwner/$repoName/contents/$path") {
                    headers {
                        append("Authorization", "token $githubToken")
                        append("Accept", "application/vnd.github.v3+json")
                    }
                }
                call.respondText(response.bodyAsText(), ContentType.Application.Json)
            } catch (e: Exception) {
                call.respondText(
                    text = "Error: ${e.message}",
                    status = HttpStatusCode.InternalServerError
                )
            }
        }

        // 提交历史代理
        get("/api/commits/{...}") {
            val path = call.parameters["..."] ?: ""
            val githubToken = System.getenv("GITHUB_TOKEN")
            
            if (githubToken.isNullOrEmpty()) {
                call.respondText(
                    text = "Error: GitHub token not configured",
                    status = HttpStatusCode.InternalServerError
                )
                return@get
            }

            val repoOwner = "android-greenhand"
            val repoName = "Logseq"

            try {
                val response = client.get("https://api.github.com/repos/$repoOwner/$repoName/commits") {
                    parameter("path", path)
                    parameter("per_page", 1)
                    headers {
                        append("Authorization", "token $githubToken")
                        append("Accept", "application/vnd.github.v3+json")
                    }
                }
                call.respondText(response.bodyAsText(), ContentType.Application.Json)
            } catch (e: Exception) {
                call.respondText(
                    text = "Error: ${e.message}",
                    status = HttpStatusCode.InternalServerError
                )
            }
        }
    }
} 