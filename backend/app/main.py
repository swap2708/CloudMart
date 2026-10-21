from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import (
    admin_router,
    auth_router,
    cart_router,
    health_router,
    orders_router,
    products_router,
)
from app.services.notification_service import notification_service


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    """Application startup and shutdown lifespan management."""
    # Register in-process notification event handlers
    notification_service.register_handlers()
    yield


def create_app() -> FastAPI:
    """FastAPI application factory configuring OpenAPI documentation, CORS, and routers."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="CloudMart: Cloud-Native E-Commerce Backend API",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Configure CORS
    origins = (
        settings.CORS_ORIGINS
        if isinstance(settings.CORS_ORIGINS, list)
        else [settings.CORS_ORIGINS]
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global unhandled exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal server error occurred.", "error": str(exc)},
        )

    # Include routers
    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(products_router)
    app.include_router(orders_router)
    app.include_router(cart_router)
    app.include_router(admin_router)

    return app


app = create_app()
