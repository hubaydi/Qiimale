import {
  AlertCircle,
  ChevronRight,
  Database,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { Post } from "@/../payload-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPayloadClient } from "@/lib/get-payload";

export default async function Home() {
  let stats = {
    users: 0,
    categories: 0,
    posts: 0,
  };
  let recentPosts: Post[] = [];
  let dbError: string | null = null;
  let isConnected = false;

  try {
    const payload = await getPayloadClient();
    if (payload) {
      isConnected = true;
      const usersRes = await payload.find({
        collection: "users",
        limit: 1,
      });
      const categoriesRes = await payload.find({
        collection: "categories",
        limit: 1,
      });
      const postsRes = await payload.find({
        collection: "posts",
        limit: 3,
        sort: "-createdAt",
      });

      stats = {
        users: usersRes.totalDocs,
        categories: categoriesRes.totalDocs,
        posts: postsRes.totalDocs,
      };
      recentPosts = postsRes.docs;
    }
  } catch (error) {
    dbError = error instanceof Error ? error.message : "Unknown error";
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              P
            </div>
            <span className="font-bold text-lg tracking-tight">
              Payload template
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Button asChild variant="default" size="sm">
              <Link href="/admin">Go to Admin Panel</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Hero Section */}
        <section className="space-y-4 text-center sm:text-left max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Welcome to your Payload template.
          </h1>
          <p className="text-xl text-muted-foreground">
            A production-ready stack powered by Next.js 16 (App Router), Payload
            CMS 3.x, Tailwind CSS v4, and MongoDB.
          </p>
        </section>

        {/* Status Section */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold tracking-tight">
                  Database Connection
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Connecting Payload CMS with MongoDB Database URL.
              </p>
            </div>
            <div>
              {isConnected ? (
                <Badge
                  variant="default"
                  className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" />
                  Connected
                </Badge>
              ) : (
                <Badge
                  variant="destructive"
                  className="bg-destructive/10 text-destructive border border-destructive/20"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive mr-1.5" />
                  Disconnected
                </Badge>
              )}
            </div>
          </div>

          {dbError && (
            <div className="mt-4 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-mono overflow-auto max-h-32 flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Connection Error:</p>
                <pre className="whitespace-pre-wrap">{dbError}</pre>
              </div>
            </div>
          )}
        </Card>

        {/* Stats Cards */}
        <section className="grid gap-6 sm:grid-cols-3">
          {/* Card 1 */}
          <Card className="hover:border-foreground/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {stats.users}
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-2">
                Admin panel users authorized to manage content.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="hover:border-foreground/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Categories
              </CardTitle>
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {stats.categories}
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-2">
                Taxonomy terms to categorize your blog posts.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="hover:border-foreground/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Posts
              </CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {stats.posts}
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-2">
                Documents stored in the posts collection.
              </CardDescription>
            </CardContent>
          </Card>
        </section>

        {/* Content Preview Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Recent Posts</h2>
            <Button asChild variant="ghost" size="sm">
              <Link
                href="/admin/collections/posts"
                className="flex items-center"
              >
                Manage Posts
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          {recentPosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {recentPosts.map((post) => (
                <Card
                  key={post.id}
                  className="overflow-hidden flex flex-col justify-between"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {post._status || "Draft"}
                      </Badge>
                      {post.publishedAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-xl leading-snug">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {typeof post.content === "string"
                        ? post.content
                        : "Rich text content..."}
                    </p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      By:{" "}
                      {typeof post.author === "object"
                        ? post.author?.name || post.author?.email
                        : "Admin"}
                    </span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-muted-foreground">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">
                  No posts published yet
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Create a new post in the Payload admin panel to see it
                  displayed dynamically on this dashboard.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin">Log in and Create Post</Link>
              </Button>
            </Card>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/20 py-8">
        <div className="container max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Next.js + Payload Template</p>
          <div className="flex gap-4">
            <a
              href="https://payloadcms.com/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              Payload Docs
            </a>
            <a
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              Next.js Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
