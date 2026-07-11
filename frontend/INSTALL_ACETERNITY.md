# Installing Aceternity UI Components

## Step 1: Install Aceternity UI

```bash
cd frontend

# Install Aceternity UI
npm install aceternity-ui

# Install required dependencies
npm install framer-motion
```

## Step 2: Setup Complete

Aceternity components are now available for use!

## Components We'll Use

1. **Globe** - 3D globe visualization for hero section
2. Other components as needed (cards, buttons, etc.)

## Usage Example

```tsx
import { Globe } from "@/components/aceternity/globe";

export function HeroWithGlobe() {
  return (
    <div className="flex">
      <div className="left-side">Content here</div>
      <Globe />
    </div>
  );
}
```

## Next

Once installed, we'll create:
1. Header component
2. Hero with Globe (left content, right globe)
3. Stats Bar
4. Landing page integration
