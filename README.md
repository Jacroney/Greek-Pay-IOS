# GreekPay iOS App

A React Native + Expo iOS app for the GreekPay member dashboard.

## Features

- **Member Dashboard**: View dues balance, payment plans, and installment progress
- **Authentication**: Secure login with session persistence
- **Payments**: Pay dues via Stripe (card payments)
- **Payment History**: View all past payments
- **Profile Management**: Edit member information

## Tech Stack

- **Expo** (managed workflow)
- **React Native** with TypeScript
- **Expo Router** for file-based navigation
- **NativeWind** (TailwindCSS for React Native)
- **Supabase** for backend/auth
- **Stripe** for payments

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Expo Go app on your phone

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Jacroney/Greek-Pay-IOS.git
cd Greek-Pay-IOS
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-pk
```

5. Start the development server:
```bash
npm start
```

6. Press `i` to open in iOS Simulator or scan QR code with Expo Go

## Project Structure

```
├── app/                    # Expo Router pages
│   ├── (auth)/            # Auth screens (login, forgot-password)
│   ├── (app)/             # Protected screens (dashboard, profile, etc.)
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── hooks/                 # React hooks (useAuth)
├── services/              # API services (supabase, auth, dues, payments)
├── types/                 # TypeScript types
└── utils/                 # Utility functions
```

## Building for Production

### iOS Build

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure the project:
```bash
eas build:configure
```

4. Build for iOS:
```bash
npm run build:ios
```

5. Submit to App Store:
```bash
npm run submit:ios
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key |

## License

Private - GreekPay
