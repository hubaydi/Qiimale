# Next.js + Payload CMS v3 + Tailwind CSS v4 Boilerplate

A production-ready monolithic template built with **Next.js 16 (App Router)**, **Payload CMS 3.x**, **Tailwind CSS v4**, **shadcn UI**, and **MongoDB**. This template provides a solid foundation for building content-rich web applications with a unified developer experience.

---

## ⚡ Features

- 🏗️ **Monolithic Architecture**: Next.js App Router and Payload CMS run concurrently in a single Next.js application.
- 🔐 **Preconfigured Authentication**: Full `Users` collection configured out-of-the-box with access control helpers (`isAdmin` and `isAdminOrSelf`).
- 📝 **Sample CMS Collections**: `Posts` (including draft/published states, rich text using the Lexical editor, and relations) and `Categories` collections are pre-implemented.
- 🎨 **Tailwind CSS v4 + shadcn UI**: Modern styling system using Tailwind v4 imports, fully integrated with real shadcn components (`Card`, `Button`, `Badge`) and `lucide-react` icons.
- ⚡ **Superfast Biome Toolchain**: Super-speedy linting and formatting configuration out-of-the-box using Biome.
- 🦕 **Type-safe CMS Schemas**: Type definitions are compiled automatically to keep your frontend completely aligned with your database schema.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v20+ recommended)
- [MongoDB](https://www.mongodb.com) (Local instance or MongoDB Atlas cluster)
- [pnpm](https://pnpm.io) (Recommended package manager)

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/hubaydi/nextjs-payload-template.git
   cd nextjs-payload-template
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**
   Copy the example environment file:

   ```bash
   cp .env.example .env.local
   ```

   Open `.env.local` and specify your MongoDB connection URL and Payload Secret:

   ```env
   DATABASE_URL=mongodb://localhost:27017/your-db-name
   PAYLOAD_SECRET=your-random-long-secret-key
   ```

4. **Regenerate types and import maps**
   Ensure your CMS configuration matches the local environment:

   ```bash
   pnpm generate:importmap
   pnpm generate:types
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   ```

Once the server is running:

- Frontend is accessible at: [http://localhost:3000](http://localhost:3000)
- Payload Admin panel is accessible at: [http://localhost:3000/admin](http://localhost:3000/admin) (Create your initial admin user upon first visit)

---

## 🛠️ CLI Commands

| Command                   | Description                                                                  |
| :------------------------ | :--------------------------------------------------------------------------- |
| `pnpm dev`                | Run the Next.js development server.                                          |
| `pnpm build`              | Create a production build of the Next.js app and Payload.                    |
| `pnpm start`              | Run the production build server.                                             |
| `pnpm generate:types`     | Compile collection schemas into TypeScript definitions (`payload-types.ts`). |
| `pnpm generate:importmap` | Compile import map for dynamic imports inside the Payload admin panel.       |
| `pnpm format`             | Run the Biome code formatter to format files in place.                       |
| `pnpm lint`               | Run the Biome linter to verify code guidelines and accessibility compliance. |

---

## 📁 Directory Structure

```text
├── src/
│   ├── access/          # CMS collection access-control utilities
│   ├── app/
│   │   ├── (frontend)/  # Main website frontend code & pages
│   │   └── (payload)/   # Payload CMS admin interface routing
│   ├── collections/     # Payload CMS Database Collections definitions
│   ├── components/      # UI components (shadcn components, layouts)
│   ├── lib/             # Utility functions & Payload client initializer
│   └── payload.config.ts# Core Payload CMS configuration file
├── payload-types.ts     # Auto-generated TypeScript definitions for CMS collections
├── tsconfig.json        # TypeScript configuration
├── biome.json           # Biome linter and formatter rules
└── package.json         # Scripts and dependencies
```

---

## 🔒 Access Controls

- **Admin/Editor Control**: Read access on drafts is restricted. Standard visitors can only read published posts (`_status === 'published'`), while logged-in users have full access.
- **Self Modification**: Users can only update their own profile details, but any logged-in administrator has full delete rights.

## 📄 License

This project is licensed under the MIT License. Feel free to use it for personal or commercial projects.
