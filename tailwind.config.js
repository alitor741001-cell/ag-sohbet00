/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
            anka: { DEFAULT: 'hsl(var(--anka-night) / <alpha-value>)', gold: 'hsl(var(--anka-gold) / <alpha-value>)', ember: 'hsl(var(--anka-ember) / <alpha-value>)' },
            cabinet: { DEFAULT: 'hsl(var(--cabinet-night) / <alpha-value>)', surface: 'hsl(var(--cabinet-surface) / <alpha-value>)', light: 'hsl(var(--cabinet-light) / <alpha-value>)', gold: 'hsl(var(--cabinet-gold) / <alpha-value>)', ink: 'hsl(var(--cabinet-ink) / <alpha-value>)' },
            fantasy: { gold: 'hsl(var(--fantasy-gold) / <alpha-value>)', text: 'hsl(var(--fantasy-text) / <alpha-value>)' },
			purple: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a' },
			pink: { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827', 950: '#030712' },
			anthracite: {
				DEFAULT: 'hsl(var(--anthracite) / <alpha-value>)',
				raised: 'hsl(var(--anthracite-raised) / <alpha-value>)'
			},
			premium: {
				gold: 'hsl(var(--premium-gold) / <alpha-value>)',
				'gold-light': 'hsl(var(--premium-gold-light) / <alpha-value>)',
				'gold-deep': 'hsl(var(--premium-gold-deep) / <alpha-value>)',
				red: 'hsl(var(--premium-red) / <alpha-value>)',
				'red-deep': 'hsl(var(--premium-red-deep) / <alpha-value>)'
			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
			catalog: 'hsl(var(--catalog-surface))',
			slot: {
				DEFAULT: 'hsl(var(--slot-bg) / <alpha-value>)',
				surface: 'hsl(var(--slot-surface) / <alpha-value>)',
				panel: 'hsl(var(--slot-panel) / <alpha-value>)',
				border: 'hsl(var(--slot-border) / <alpha-value>)',
				gold: 'hsl(var(--slot-gold) / <alpha-value>)',
				'gold-deep': 'hsl(var(--slot-gold-deep) / <alpha-value>)',
				green: 'hsl(var(--slot-green) / <alpha-value>)',
				'green-deep': 'hsl(var(--slot-green-deep) / <alpha-value>)',
				red: 'hsl(var(--slot-red) / <alpha-value>)',
				purple: 'hsl(var(--slot-purple) / <alpha-value>)',
				orange: 'hsl(var(--slot-orange) / <alpha-value>)',
				pink: 'hsl(var(--slot-pink) / <alpha-value>)',
				blue: 'hsl(var(--slot-blue) / <alpha-value>)',
				text: 'hsl(var(--slot-text) / <alpha-value>)'
			},
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)'],
  			mono: ['var(--font-mono)']
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'slot-win-coin': {
  				'0%': { transform: 'translateY(-20%) rotate(-25deg)', opacity: '0' },
  				'12%': { opacity: '1' },
  				'100%': { transform: 'translateY(38vh) rotate(25deg)', opacity: '0' }
  			},
  			'slot-win-pop': {
  				'0%': { transform: 'scale(0.7)', opacity: '0' },
  				'60%': { transform: 'scale(1.06)', opacity: '1' },
  				'100%': { transform: 'scale(1)', opacity: '1' }
  			},
  			'slot-win-sheen': {
  				'0%': { transform: 'translateX(0)' },
  				'60%, 100%': { transform: 'translateX(500%)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'slot-win-coin': 'slot-win-coin 2.2s linear infinite',
  			'slot-win-pop': 'slot-win-pop 0.5s ease-out both',
  			'slot-win-sheen': 'slot-win-sheen 2.6s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
