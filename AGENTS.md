# Agent Guidelines

This document contains guidelines and patterns for AI agents working on this codebase.

## UI Patterns

### Buttons with Async Operations

**Default Pattern**: For every button that runs an async operation, the button should:

1. **Show a loading spinner** while the operation is running
2. **Toast any errors** that occur during the operation
3. **Disable the button** during the operation to prevent duplicate requests

#### Example Implementation

```tsx
const [isLoading, setIsLoading] = useState(false);

const handleAsyncAction = async () => {
  setIsLoading(true);
  try {
    await someAsyncOperation();
    toast.success("Operation completed successfully!");
  } catch (error) {
    console.error("Error:", error);
    toast.error(error instanceof Error ? error.message : "Operation failed");
  } finally {
    setIsLoading(false);
  }
};

return (
  <Button onClick={handleAsyncAction} disabled={isLoading}>
    {isLoading ? (
      <>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </>
    ) : (
      "Submit"
    )}
  </Button>
);
```

#### Key Requirements

- **Always wrap async operations in try/catch**
- **Always show loading state** with spinner icon (use `Loader2` from lucide-react)
- **Always toast errors** - extract error message if possible, otherwise use generic message
- **Always disable button** during loading to prevent duplicate submissions
- **Always clean up** in finally block to reset loading state

#### Icons to Use

- `Loader2` - For loading spinners (with `animate-spin` class)
- Import from `lucide-react`: `import { Loader2 } from "lucide-react"`

## Tech Stack

- **Framework**: Next.js (App Router)
- **UI Library**: shadcn/ui components
- **Icons**: lucide-react
- **Notifications**: sonner (toast)
- **Database**: Prisma + PostgreSQL
- **Auth**: Better Auth
- **Styling**: Tailwind CSS

## Project Structure

- `/app` - Next.js app router pages
- `/components` - React components
  - `/ui` - shadcn/ui components
  - Top-level components for features
- `/lib` - Utilities and shared code
  - `/actions` - Server actions
  - `/types` - TypeScript types
  - `/generated/client` - Prisma generated client
- `/prisma` - Database schema and migrations

## Code Style

- Use TypeScript for all new files
- Use "use client" directive for client components
- Use "use server" directive for server action files (these can ONLY export async functions)
- Prefer async/await over promise chains
- Always handle errors with try/catch
- Use toast notifications for user feedback
- Keep components small and focused

## Documentation

- **Explained documentation files** should be placed in the `/docs` folder
- Use clear, descriptive filenames (e.g., `ANONYMOUS_SESSION_TESTING.md`)
- Follow markdown best practices for readability
