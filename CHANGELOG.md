# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Core E-commerce Features:** Fully functional Shopping Cart and Checkout workflows designed to accommodate rigorous software testing scenarios.
- **Frontend App:** React application built with TypeScript and Vite, featuring user authentication, product browsing, and cart management state (Zustand).
- **Backend API:** Spring Boot REST API with stateless JWT authentication, rate limiting, and an H2 In-Memory database seeded with initial test data.
- **Unit & Integration Testing:** Comprehensive test suites using JUnit 5, Mockito, and Spring Boot Test for the backend, and Vitest for the frontend.
- **End-to-End (E2E) Testing:** Automated browser testing using Playwright to verify the complete user journey from adding items to checkout.
- **CI/CD Pipeline:** GitHub Actions workflow (`ci.yml`) to automatically build, lint, and run all backend, frontend, and E2E tests upon repository push/pull requests.
- **Docker Support:** `docker-compose.yml` for quick, containerized local deployment.
