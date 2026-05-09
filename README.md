# ShopCart - Software Testing Capstone Project

A full-stack e-commerce application engineered specifically to serve as a comprehensive testing ground for advanced Software Quality Assurance (QA) techniques.

This project was developed to fulfill the requirements of a university Software Testing course, demonstrating practical, hands-on implementations of Unit, Integration, Mock, End-to-End (E2E), Performance, and Security testing methodologies.

## 🎯 Project Objective

The primary goal of this repository is not to build a complex, production-ready storefront, but rather a structurally sound application that allows for the rigorous application of modern testing frameworks. The system includes intentional domain boundaries, stock validations, and security measures designed specifically to be verified by automated test scripts.

## ✨ Core Features

- **Secure Authentication**: User login and registration utilizing stateless JSON Web Tokens (JWT) stored safely in HttpOnly cookies.
- **Product Catalog**: Browse mock products seeded dynamically into an in-memory database.
- **Cart Management**: Add items, modify quantities (with strict backend stock validation), and remove items.
- **Checkout Workflow**: Calculate subtotals, apply mock discount coupons, calculate shipping, and securely place orders via atomic database transactions.

## 📂 Project Structure

```txt
.
├── .github/workflows/ci.yml # Automated CI Pipeline (Runs all tests on Push/PR)
├── client/                  # Frontend application (React 19 + Vite 8)
│   ├── e2e/                 # Playwright End-to-End test suites
│   ├── src/test/            # Vitest Unit and Integration tests
│   ├── playwright.config.ts # Playwright E2E configuration
│   ├── vitest.config.ts     # Vitest configuration
│   └── ...                  # React components, stores, and assets
├── server/                  # Backend application (Spring Boot 3.5 + Java 25)
│   ├── src/main/java/...    # Application source code
│   ├── src/test/java/...    # JUnit 5, Mockito, and Security tests
│   ├── pom.xml              # Project dependencies (Testing starters, JJWT, etc.)
│   └── ...                  # Other backend resources
├── documents/               # Assignment requirements, test plans, and QA reports
├── docker-compose.yml       # Infrastructure for containerized integration testing
└── ...                      # Project configuration files and documentations
```

## 🛠️ Tech Stack

### Backend

- **Framework**: Spring Boot 3.5 (Java 25)
- **Security**: Spring Security, JJWT
- **Persistence**: Spring Data JPA
- **Database**: H2 (In-memory for Dev/Test), PostgreSQL (Production)
- **Tools**: Lombok, Maven

### Frontend

- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Routing**: React Router DOM
- **HTTP Client**: Axios

## 📦 Installation & Setup

### Prerequisites

- Java 25+
- Node.js 24+
- Docker (optional, for PostgreSQL)

### Running Locally (Quick Start)

By default, the backend uses an H2 in-memory database, so no external database setup is required.

1. **Start the Backend**:

   ```bash
   cd server
   ./mvnw spring-boot:run
   ```

2. **Start the Frontend**:

   ```bash
   cd client
   npm install
   npm run dev
   ```

3. **Access the App**:
   Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running with Docker (PostgreSQL)

To use a persistent PostgreSQL database:

1. **Start the Database**:

   ```bash
   docker-compose up -d
   ```

2. **Run Backend with Production Profile**:

   ```bash
   cd server
   SPRING_PROFILES_ACTIVE=prod ./mvnw spring-boot:run
   ```

## 🧪 Testing Techniques Implemented

This project serves as a comprehensive example of various testing methodologies:

### 1. Unit Testing

- **Backend**: Service-level logic testing (e.g., `CartServiceTest`) using JUnit 5 and Mockito.
- **Frontend**: Utility and logic testing (e.g., `priceCalculation.test.ts`) using Vitest.

### 2. Integration Testing

- **API Testing**: Testing REST endpoints with real database context (H2) using `@SpringBootTest` and `MockMvc`.
- **Database Testing**: Verifying JPA repositories and transaction management.

### 3. Mocking & Component Testing

- **Mocking**: Using Mockito (Java) and Vitest Mocks (TS) to isolate components (e.g., `OrderServiceMockTest`, `Cart.mock.test.tsx`).
- **React Component Testing**: Testing UI components in isolation with React Testing Library.

### 4. End-to-End (E2E) Testing

- **User Flows**: Full browser-based testing of critical paths (Login -> Add to Cart -> Checkout) using Playwright.

### 5. Security Testing

- **Vulnerability Checks**: Automated tests for SQL Injection, XSS, and IDOR (e.g., `SecurityIntegrationTest`).
- **Protection Verification**: Verifying CSRF mitigations (SameSite cookies) and Rate Limiting.

## 🛠️ How to Run Tests

### Backend Tests (JUnit 5)

```bash
cd server
./mvnw test
```

### Frontend Tests (Vitest)

```bash
cd client
npm run test
```

### End-to-End Tests (Playwright)

```bash
cd client
npx playwright test
```

### Viewing Playwright Reports

After running the E2E tests, you can view the detailed HTML report by running:

```bash
cd client
npx playwright show-report
```

This will open a browser window with a comprehensive breakdown of test results, including screenshots and traces if enabled.

## ⚙️ CI/CD Pipeline

This project includes a fully configured GitHub Actions workflow in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) that automatically:

1. **Backend Verification**: Runs all Java tests using JDK 25 and a PostgreSQL service container.
2. **Frontend Verification**: Runs Vitest suites to ensure client-side logic is sound.
3. **E2E Validation**: Executes the Playwright test suite in a headless environment.
4. **Artifacts**: Uploads test coverage (Jacoco) and Playwright HTML reports for every run.

## 📝 Usage

### Test Accounts

The database is pre-seeded with the following accounts (auto-loaded on startup):

- **User 1**: `test1@example.com` / `password123`
- **User 2**: `test2@example.com` / `password123`

### Coupons

- `SAVE10`: 10% discount
- `SUMMER50`: 50% discount

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
