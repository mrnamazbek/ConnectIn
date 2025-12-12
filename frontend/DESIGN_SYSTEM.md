# ConnectIn Glassmorphism Design System

> **Design Philosophy**: Apple-inspired liquid glass effects with controlled neon accents for a premium, investor-grade aesthetic.

## 🎨 Color Palette

### Dark Mode Backgrounds
- **Primary**: `#070A0E` - Deep space black
- **Secondary**: `#0F1624` - Midnight blue-black
- **Tertiary**: `#0A1A15` - Dark forest teal
- **Elevated**: `#1A1F2E` - Elevated surfaces

### Neon Accents
- **Blue**: `#00D4FF` - Electric blue
- **Aqua**: `#00FFF0` - Cyber aqua (primary accent)
- **Lime**: `#BFFF00` - Freedom green
- **Purple**: `#B537FF` - Electric purple
- **Pink**: `#FF006E` - Hot pink

### Text Colors
- **Primary**: `#FFFFFF` - White
- **Secondary**: `#B4B8C5` - Light gray
- **Tertiary**: `#6B7280` - Medium gray
- **Accent**: Neon aqua

## 🧱 Components

### GlassCard
Reusable card component with glassmorphism effects.

**Variants**:
- `default` - Standard glass card
- `highlighted` - With neon border and glow
- `interactive` - Clickable with hover scale

**Usage**:
```jsx
import { GlassCard } from '@/components/ui';

<GlassCard variant="highlighted" className="p-6">
  <h3>Card Title</h3>
  <p>Card content</p>
</GlassCard>
```

### GlassButton
Premium button with glass effects and animations.

**Variants**:
- `primary` - Main action button with neon gradient
- `secondary` - Secondary actions
- `ghost` - Minimal border-only style

**Sizes**: `sm`, `md`, `lg`

**Features**:
- Loading states with spinner
- Icon support (left/right)
- Disabled states
- Hover shimmer animation

**Usage**:
```jsx
import { GlassButton } from '@/components/ui';

<GlassButton variant="primary" size="md" loading={isLoading}>
  Submit
</GlassButton>
```

### GlassInput
Form input with glass styling and focus effects.

**Features**:
- Label support
- Icon support (left-aligned)
- Error states with messages
- Focus glow animation
- Required field indicator

**Usage**:
```jsx
import { GlassInput } from '@/components/ui';

<GlassInput
  label="Email"
  type="email"
  placeholder="your@email.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
  error={emailError}
/>
```

### SkillChip
Badge component for displaying skills, tags, or technologies.

**Variants**: `blue`, `aqua`, `lime`, `purple`

**Features**:
- Neon glow on hover
- Optional remove button
- Icon support

**Usage**:
```jsx
import { SkillChip } from '@/components/ui';

<SkillChip
  label="React"
  variant="aqua"
  onRemove={() => handleRemove('React')}
/>
```

### GlassModal
Premium modal dialog with backdrop blur.

**Sizes**: `sm`, `md`, `lg`, `xl`

**Features**:
- Backdrop blur overlay
- Smooth animations
- Keyboard support (ESC to close)
- Body scroll lock
- Optional close button

**Usage**:
```jsx
import { GlassModal } from '@/components/ui';

<GlassModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
>
  <p>Modal content</p>
</GlassModal>
```

## 🎭 Typography Classes

- `.text-display` - Extra large display text (3.5rem)
- `.text-h1` - Heading 1 (2.5rem)
- `.text-h2` - Heading 2 (2rem)
- `.text-h3` - Heading 3 (1.5rem)
- `.text-body-lg` - Large body (1.125rem)
- `.text-body` - Standard body (1rem)
- `.text-body-sm` - Small body (0.875rem)
- `.text-caption` - Caption text (0.75rem)

**Special Effects**:
- `.text-glass` - Gradient glass text effect
- `.text-neon` - Neon glow effect

## 🌟 Animations

### Keyframe Animations
- `.animate-float` - Subtle floating motion
- `.animate-pulse-glow` - Pulsing neon glow
- `.animate-shimmer` - Shimmer/shine effect

### Example:
```jsx
<GlassCard className="animate-float">
  Floating card
</GlassCard>
```

## 🛠️ Utility Classes

### Backdrop Blur
- `.backdrop-blur-sm` - 10px blur
- `.backdrop-blur-md` - 20px blur
- `.backdrop-blur-lg` - 40px blur
- `.backdrop-blur-xl` - 60px blur

### Glows
- `.glow-blue` - Blue neon glow
- `.glow-aqua` - Aqua neon glow
- `.glow-lime` - Lime neon glow
- `.glow-purple` - Purple neon glow

### Borders
- `.border-glass` - Semi-transparent border
- `.border-neon-aqua` - Aqua neon border
- `.border-neon-blue` - Blue neon border
- `.border-neon-lime` - Lime neon border

### Text
- `.gradient-text` - Primary gradient text

## 📱 Responsive Behavior

All components are responsive by default. Typography scales down on mobile:
- Display, H1, H2 reduced on tablets
- Further reduction on mobile phones

## 🎯 Best Practices

1. **Layer Glass Cards**: Stack glass effects for depth
2. **Use Neon Sparingly**: Accent colors for highlights, not everywhere
3. **Smooth Transitions**: All interactions use 300ms transitions
4. **Accessibility**: All components include proper ARIA labels
5. **Dark Mode First**: Designed for dark backgrounds

## 🚀 Getting Started

1. Import the design system CSS:
```css
@import "./styles/design-system.css";
```

2. Import components:
```jsx
import { GlassCard, GlassButton, GlassInput, SkillChip, GlassModal } from '@/components/ui';
```

3. View the showcase page at `/components-showcase` for live examples.

## 🎨 Design Tokens

CSS custom properties are available for advanced customization:
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- `--neon-blue`, `--neon-aqua`, `--neon-lime`
- `--glass-white`, `--glass-border`
- `--blur-sm`, `--blur-md`, `--blur-lg`
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- `--transition-fast`, `--transition-base`, `--transition-slow`

Refer to `design-system.css` for the complete list.
