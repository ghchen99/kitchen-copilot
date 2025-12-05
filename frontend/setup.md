# Create Next.js app with TypeScript
npx create-next-app@latest kitchen-copilot-frontend --typescript --tailwind --eslint --app --src-dir

# Navigate to the project
cd kitchen-copilot-frontend

# Install shadcn UI
npx shadcn@latest init

# Install required dependencies
npm install axios sonner react-dropzone clsx

# Install shadcn components we'll need
npx shadcn@latest add button card tabs alert dialog separator progress avatar

# Create our directory structure
mkdir -p src/components/ui
mkdir -p src/components/kitchen
mkdir -p src/lib
mkdir -p src/types
mkdir -p src/app/api