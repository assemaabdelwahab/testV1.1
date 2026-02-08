# Coffee Personality Quiz - Requirements

## Overview
A "What's Your Coffee Personality?" quiz that recommends a coffee drink based on lifestyle preferences.

## Personality → Coffee Pairings

1. **Bold Adventurer** → Double Espresso
   - Tagline: "You live for intensity"
   - For users who: seek adventure, intensity, challenges, bold experiences

2. **Cozy Classic** → Medium Roast Drip
   - Tagline: "Comfort in every cup"
   - For users who: value tradition, comfort, reliability, familiar routines

3. **Sweet Enthusiast** → Caramel Latte
   - Tagline: "Life's too short for bitter"
   - For users who: embrace fun, indulgence, sweetness, enjoyment

4. **Zen Minimalist** → Black Coffee, Single Origin
   - Tagline: "Simple. Clean. Perfect."
   - For users who: prefer simplicity, mindfulness, quality over quantity

## Result Display
- **Single recommendation**: Show the user's top personality type with its coffee recommendation
- If tied, show the first personality alphabetically

## Visual Style
- Clean and minimal design
- Text-only (no icons)
- Clear typography
- Simple button/card layouts
- Professional but approachable

## Images
- Skip images for initial build
- Can add later during iteration phase

## Quiz Questions

### Question 1: Weekend Plans
**"Your ideal weekend involves:"**
- Trying a new extreme sport or adventure activity → Bold Adventurer
- Relaxing at home with a good book or movie → Cozy Classic
- Brunch with friends and exploring local cafes → Sweet Enthusiast
- A peaceful hike or meditation session → Zen Minimalist

### Question 2: Travel Style
**"When planning a vacation, you:"**
- Book a backpacking trip to an unexplored destination → Bold Adventurer
- Return to your favorite familiar spot → Cozy Classic
- Pick somewhere Instagram-worthy with great food → Sweet Enthusiast
- Choose a quiet retreat focused on wellness → Zen Minimalist

### Question 3: Morning Routine
**"Your morning routine is:"**
- Quick and efficient - you're out the door fast → Bold Adventurer
- Consistent and comforting - same routine every day → Cozy Classic
- Leisurely with treats - maybe pastries or a fancy breakfast → Sweet Enthusiast
- Intentional and minimal - meditation and simple breakfast → Zen Minimalist

### Question 4: Social Situations
**"At a party, you're most likely to:"**
- Be the center of attention with a bold story → Bold Adventurer
- Stick with your close friends in a quiet corner → Cozy Classic
- Mingle and make everyone laugh → Sweet Enthusiast
- Have meaningful one-on-one conversations → Zen Minimalist

### Question 5: Work Style
**"When tackling a big project, you:"**
- Dive in headfirst and figure it out as you go → Bold Adventurer
- Follow a tried-and-true method that's worked before → Cozy Classic
- Make it fun with music, snacks, and breaks → Sweet Enthusiast
- Break it down into simple, focused steps → Zen Minimalist

### Question 6: Food Preferences
**"When choosing what to eat, you prefer:"**
- Spicy, bold flavors that make a statement → Bold Adventurer
- Classic comfort food you've loved forever → Cozy Classic
- Dessert-like dishes or sweet flavors → Sweet Enthusiast
- Simple, high-quality ingredients prepared minimally → Zen Minimalist

## Scoring Logic
- Each answer maps to one personality type
- Tally which personality was selected most frequently
- Display the winning personality with its coffee recommendation
- Format: "You're a [Personality]! [Tagline]. Your coffee: [Coffee Name]"

## Technology
- Next.js (React framework)
- JavaScript/TypeScript
- Simple, responsive design
- Works on desktop and mobile
