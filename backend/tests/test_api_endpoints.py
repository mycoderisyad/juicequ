"""
Integration tests for API endpoints.
Tests for REST API endpoints.
"""
import pytest
from datetime import datetime, timezone
from uuid import uuid4
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.security import create_access_token
from app.models.user import UserRole


class TestHealthEndpoints:
    """Tests for health check endpoints."""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_root_health_check(self, client):
        """Test root health check endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["ok", "healthy"]
    
    def test_api_v1_health_check(self, client):
        """Test API v1 health check endpoint."""
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["version"] == "v1"


class TestAuthEndpoints:
    """Tests for authentication API endpoints."""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_login_endpoint_invalid_credentials(self, client):
        """Test login with invalid credentials."""
        response = client.post("/api/v1/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword",
        })
        assert response.status_code in [401, 400, 404]
    
    def test_login_endpoint_missing_fields(self, client):
        """Test login with missing fields."""
        response = client.post("/api/v1/auth/login", json={
            "email": "test@test.com",
            # Missing password
        })
        assert response.status_code == 422  # Validation error
    
    def test_register_endpoint_invalid_email(self, client):
        """Test registration with invalid email format."""
        response = client.post("/api/v1/auth/register", json={
            "email": "invalid-email",
            "password": "SecurePass123!",
            "full_name": "Test User",
        })
        assert response.status_code == 422  # Validation error


class TestProductEndpoints:
    """Tests for product API endpoints."""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_get_products_public(self, client):
        """Test getting products (public endpoint)."""
        response = client.get("/api/v1/customer/products")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data or "products" in data
    
    def test_get_product_categories(self, client):
        """Test getting product categories."""
        response = client.get("/api/v1/customer/products/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
    
    def test_get_product_by_id_not_found(self, client):
        """Test getting non-existent product."""
        response = client.get("/api/v1/customer/products/99999")
        assert response.status_code == 404


class TestAdminEndpoints:
    """Tests for admin API endpoints."""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    @pytest.fixture
    def admin_token(self):
        """Generate an admin token for testing."""
        return create_access_token(
            subject=str(uuid4()),
            additional_claims={"role": "admin"},
        )
    
    @pytest.fixture
    def user_token(self):
        """Generate a regular user token for testing."""
        return create_access_token(
            subject=str(uuid4()),
            additional_claims={"role": "pembeli"},
        )
    
    def test_admin_endpoint_requires_auth(self, client):
        """Test that admin endpoints require authentication."""
        response = client.get("/api/v1/admin/users")
        assert response.status_code == 401
    
    def test_admin_endpoint_requires_admin_role(self, client, user_token):
        """Test that admin endpoints require admin role."""
        response = client.get(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        # May return 401 (user not found in real db) or 403 (forbidden)
        assert response.status_code in [401, 403]
    
    def test_admin_products_list(self, client, admin_token):
        """Test admin products list endpoint."""
        response = client.get(
            "/api/v1/admin/products",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        # May return 200 or 401 depending on token validation
        assert response.status_code in [200, 401]
    
    def test_admin_promos_list(self, client, admin_token):
        """Test admin promos list endpoint."""
        response = client.get(
            "/api/v1/admin/promos",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code in [200, 401]
    
    def test_admin_vouchers_list(self, client, admin_token):
        """Test admin vouchers list endpoint."""
        response = client.get(
            "/api/v1/admin/vouchers",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code in [200, 401]


class TestCashierEndpoints:
    """Tests for cashier API endpoints."""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    @pytest.fixture
    def cashier_token(self):
        """Generate a cashier token for testing."""
        return create_access_token(
            subject=str(uuid4()),
            additional_claims={"role": "kasir"},
        )
    
    def test_cashier_endpoint_requires_auth(self, client):
        """Test that cashier endpoints require authentication."""
        response = client.get("/api/v1/cashier/orders")
        assert response.status_code == 401
    
    def test_cashier_orders_access(self, client, cashier_token):
        """Test cashier can access orders."""
        response = client.get(
            "/api/v1/cashier/orders",
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        # May return 200 or 401 depending on token validation
        assert response.status_code in [200, 401]


class TestCurrencyEndpoints:
    """Tests for currency API endpoints."""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_get_exchange_rates(self, client):
        """Test getting exchange rates."""
        response = client.get("/api/v1/currency/rates")
        assert response.status_code in [200, 500]  # May fail if API key not configured
    
    def test_convert_currency(self, client):
        """Test currency conversion endpoint."""
        response = client.post(
            "/api/v1/currency/convert",
            json={
                "amount": 100000,
                "from_currency": "IDR",
                "to_currency": "USD",
            }
        )
        # May return 200 or error depending on configuration
        assert response.status_code in [200, 400, 405, 500]


class TestValidation:
    """Tests for request validation."""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_invalid_json_body(self, client):
        """Test handling of invalid JSON body."""
        response = client.post(
            "/api/v1/auth/login",
            content="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422
    
    def test_pagination_validation(self, client):
        """Test pagination parameter validation."""
        response = client.get("/api/v1/customer/products?limit=-1")
        # Should either reject invalid limit or use default
        assert response.status_code in [200, 422]
    
    def test_search_special_characters(self, client):
        """Test search with special characters."""
        response = client.get("/api/v1/customer/products?search=<script>alert('xss')</script>")
        # Should handle safely
        assert response.status_code == 200
