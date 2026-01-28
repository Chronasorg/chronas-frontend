import React from 'react';
import { Button, Text, Card, SpinnerGlobal } from '../../primitives';
import { Stack, Flex, Container, Grid, GridItem } from '../../layout';
import { useUIStore, useAuthStore } from '../../../stores';
import styles from './HomePage.module.css';

// Historical background images for the hero section
const heroBackgrounds = [
  {
    year: 1871,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Wernerprokla.jpg/1280px-Wernerprokla.jpg',
    description: '1871: Proclamation of the German Empire in Versailles',
  },
  {
    year: -332,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Charles_Le_Brun_-_Entry_of_Alexander_into_Babylon.JPG/1280px-Charles_Le_Brun_-_Entry_of_Alexander_into_Babylon.JPG',
    description: "332 BCE: Alexander the Great's entry into Babylon",
  },
  {
    year: 1582,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Surikov_Pokoreniye_Sibiri_Yermakom.jpg/1280px-Surikov_Pokoreniye_Sibiri_Yermakom.jpg',
    description: '1582: Battle of Chuvash Cape',
  },
];

// Feature cards data
const features = [
  {
    icon: '🗺️',
    title: 'Interactive Map',
    description: 'Explore world history through an interactive chronological map spanning thousands of years.',
  },
  {
    icon: '📜',
    title: 'Historical Articles',
    description: 'Discover detailed articles about civilizations, battles, rulers, and cultural developments.',
  },
  {
    icon: '⚔️',
    title: 'Battles & Wars',
    description: 'Track major conflicts and military campaigns that shaped the course of history.',
  },
  {
    icon: '👑',
    title: 'Rulers & Leaders',
    description: 'Learn about the monarchs, emperors, and leaders who ruled throughout the ages.',
  },
  {
    icon: '🏛️',
    title: 'Civilizations',
    description: 'Follow the rise and fall of great civilizations from ancient times to the modern era.',
  },
  {
    icon: '🎨',
    title: 'Art & Culture',
    description: 'Explore artistic movements, cultural achievements, and scientific discoveries.',
  },
];

// Quick stats
const stats = [
  { value: '4000+', label: 'Years of History' },
  { value: '50K+', label: 'Historical Events' },
  { value: '10K+', label: 'Articles' },
  { value: '17', label: 'Languages' },
];

export const HomePage: React.FC = () => {
  const { theme, setTheme } = useUIStore();
  const { isAuthenticated, username } = useAuthStore();
  const [currentBgIndex, setCurrentBgIndex] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  // Rotate background images
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % heroBackgrounds.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const currentBg = heroBackgrounds[currentBgIndex];

  const handleExploreMap = () => {
    setIsLoading(true);
    // Simulate loading then navigate
    setTimeout(() => {
      setIsLoading(false);
      window.location.hash = '#/map';
    }, 1500);
  };

  const handleThemeToggle = () => {
    const themes: ('light' | 'dark' | 'luther')[] = ['light', 'dark', 'luther'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    if (nextTheme) {
      setTheme(nextTheme);
    }
  };

  if (isLoading) {
    return (
      <div className={styles['loadingContainer']}>
        <SpinnerGlobal title="Loading the map..." />
      </div>
    );
  }

  return (
    <div className={styles['homePage']}>
      {/* Hero Section */}
      <section
        className={styles['hero']}
        style={{
          backgroundImage: `
            linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%),
            url("${currentBg?.image ?? ''}")
          `,
        }}
      >
        <Container maxWidth="lg" className={styles['heroContent']}>
          <Stack spacing="lg" align="center">
            <img
              src="/images/logoChronasWhite.png"
              alt="Chronas Logo"
              className={styles['heroLogo']}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <Text variant="h1" color="inherit" align="center" className={styles['heroTitle']}>
              Chronas
            </Text>
            <Text variant="h4" color="inherit" align="center" className={styles['heroSubtitle']}>
              Explore World History Through Time
            </Text>
            <Text variant="body1" color="inherit" align="center" className={styles['heroDescription']}>
              {currentBg?.description ?? 'Journey through thousands of years of human civilization'}
            </Text>
            <Flex gap="md" justify="center" wrap="wrap">
              <Button variant="primary" size="large" onClick={handleExploreMap}>
                Explore the Map
              </Button>
              <Button variant="secondary" size="large" onClick={() => (window.location.hash = '#/discover')}>
                Discover History
              </Button>
            </Flex>
          </Stack>
        </Container>

        {/* Background indicator dots */}
        <div className={styles['bgIndicators']}>
          {heroBackgrounds.map((_, index) => (
            <button
              key={String(index)}
              className={`${styles['bgDot'] ?? ''} ${index === currentBgIndex ? styles['active'] ?? '' : ''}`}
              onClick={() => setCurrentBgIndex(index)}
              aria-label={`Background ${String(index + 1)}`}
            />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles['statsSection']}>
        <Container maxWidth="lg">
          <Grid columns={4} gap="lg" className={styles['statsGrid']}>
            {stats.map((stat) => (
              <GridItem key={stat.label}>
                <Stack spacing="xs" align="center">
                  <Text variant="h2" color="primary" className={styles['statValue']}>
                    {stat.value}
                  </Text>
                  <Text variant="body2" color="secondary">
                    {stat.label}
                  </Text>
                </Stack>
              </GridItem>
            ))}
          </Grid>
        </Container>
      </section>

      {/* Features Section */}
      <section className={styles['featuresSection']}>
        <Container maxWidth="lg">
          <Stack spacing="xl">
            <Stack spacing="sm" align="center">
              <Text variant="h2" align="center">
                Discover the Past
              </Text>
              <Text variant="body1" color="secondary" align="center">
                Chronas brings history to life with interactive tools and rich content
              </Text>
            </Stack>

            <Grid columns={3} gap="lg" className={styles['featuresGrid']}>
              {features.map((feature) => (
                <GridItem key={feature.title}>
                  <Card
                    elevation="low"
                    className={styles['featureCard']}
                    onClick={() => console.log(`Clicked: ${feature.title}`)}
                  >
                    <Stack spacing="md" align="center">
                      <span className={styles['featureIcon']}>{feature.icon}</span>
                      <Text variant="h5" align="center">
                        {feature.title}
                      </Text>
                      <Text variant="body2" color="secondary" align="center">
                        {feature.description}
                      </Text>
                    </Stack>
                  </Card>
                </GridItem>
              ))}
            </Grid>
          </Stack>
        </Container>
      </section>

      {/* Theme Switcher Section */}
      <section className={styles['themeSection']}>
        <Container maxWidth="md">
          <Card elevation="medium" className={styles['themeCard']}>
            <Flex justify="space-between" align="center" wrap="wrap" gap="md">
              <Stack spacing="xs">
                <Text variant="h5">Customize Your Experience</Text>
                <Text variant="body2" color="secondary">
                  Current theme: <strong>{theme}</strong>
                </Text>
              </Stack>
              <Button variant="secondary" onClick={handleThemeToggle}>
                Switch Theme
              </Button>
            </Flex>
          </Card>
        </Container>
      </section>

      {/* Call to Action */}
      <section className={styles['ctaSection']}>
        <Container maxWidth="md">
          <Card elevation="high" className={styles['ctaCard']}>
            <Stack spacing="lg" align="center">
              <Text variant="h3" align="center">
                Ready to Explore?
              </Text>
              <Text variant="body1" color="secondary" align="center">
                {isAuthenticated
                  ? `Welcome back, ${username ?? 'Explorer'}! Continue your journey through history.`
                  : 'Join thousands of history enthusiasts exploring the past.'}
              </Text>
              <Flex gap="md" justify="center" wrap="wrap">
                <Button variant="primary" size="large" onClick={handleExploreMap}>
                  Start Exploring
                </Button>
                {!isAuthenticated && (
                  <Button variant="text" size="large" onClick={() => (window.location.hash = '#/login')}>
                    Sign In
                  </Button>
                )}
              </Flex>
            </Stack>
          </Card>
        </Container>
      </section>
    </div>
  );
};

export default HomePage;
