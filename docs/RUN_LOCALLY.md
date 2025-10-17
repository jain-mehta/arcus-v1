# How to Run This Project Locally

This guide will walk you through the steps to get the application running on your local machine for development.

## Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js:** You can download it from [nodejs.org](https://nodejs.org/). (Version 18 or higher is recommended).
2.  **npm:** This is included with Node.js.
3.  **Firebase CLI:** If you don't have it, install it globally by running:
    ```bash
    npm install -g firebase-tools
    ```

---

## Step 1: Install Project Dependencies

1.  Open your terminal or command prompt.
2.  Navigate to the root directory of the project.
3.  Run the following command to install all the necessary packages defined in `package.json`:

    ```bash
    npm install
    ```

---

## Step 2: Set Up and Run Firebase Emulators

The application is configured to work with local Firebase emulators for services like Authentication and Firestore. This allows you to develop offline without needing a live Firebase project.

1.  Make sure you are logged into Firebase in your terminal:
    ```bash
    firebase login
    ```
2.  From the project's root directory, start the Firebase emulators. The project is already configured with a `firebase.json` file.

    ```bash
    firebase emulators:start
    ```

    You should see output indicating that the Auth and Firestore emulators have started, typically on ports like `9099` and `8080`. Keep this terminal window open; the emulators need to keep running.

---

## Step 3: Run the Genkit AI Server

The application's AI features are powered by Genkit. This runs as a separate server process during development.

1.  Open a **new terminal window** (keep the Firebase emulator terminal running).
2.  Navigate to the project's root directory.
3.  Run the following command to start the Genkit development server:

    ```bash
    npm run genkit:dev
    ```

    This will start the Genkit server, which listens for requests from the main application. Keep this terminal window open as well.

---

## Step 4: Run the Next.js Application

Finally, you can start the main Next.js development server.

1.  Open a **third terminal window** (keeping the other two running).
2.  Navigate to the project's root directory.
3.  Run the main development script:

    ```bash
    npm run dev
    ```

    This will start the Next.js application, typically on `http://localhost:3000`.

---

## Step 5: Access the Application

Once all three servers are running (Firebase Emulators, Genkit, and Next.js), you can open your web browser and navigate to:

[http://localhost:3000](http://localhost:3000)

You should see the login page, and you can use the mock user credentials (`admin@example.com` / `Admin@123`) to log in.

## Summary of Terminals

You will have three separate terminal windows running simultaneously for local development:

-   **Terminal 1:** `firebase emulators:start`
-   **Terminal 2:** `npm run genkit:dev`
-   **Terminal 3:** `npm run dev`
