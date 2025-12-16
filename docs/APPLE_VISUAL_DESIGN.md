# Apple Visual Design System - Implementation Guide

## Overview
This guide defines the **Apple-caliber visual design system** for HeyPsych medication pages. Every design decision follows Apple's principles: **Clarity**, **Deference**, and **Depth**.

---

## Design Principles

### 1. **Clarity**
- Content is king - no visual element competes with information
- Clear typography hierarchy (SF Pro Display/Text)
- Generous whitespace (40px section gaps, 24px card padding)
- High contrast for readability (AA+ WCAG compliance)

### 2. **Deference**
- UI recedes, content advances
- Subtle cards (0.08 opacity shadows)
- Minimal color (purposeful accents only)
- No unnecessary ornamentation

### 3. **Depth**
- Visual layers suggest hierarchy
- Elevated cards for importance
- Sticky critical warnings
- Progressive disclosure (expand/collapse)

---

## Typography System

### Fonts
- **Headings**: SF Pro Display (600 weight)
- **Body**: SF Pro Text (400 weight)
- **Code/Data**: SF Mono (400 weight)

### Scale
```
H1: 32px / 600 / -0.01em    (Page title)
H2: 24px / 600 / -0.01em    (Section headings)
H3: 20px / 600 / -0.01em    (Subsections)
H4: 17px / 600 / -0.01em    (Card titles)

Body Large:   17px / 400 / normal  (Hero text)
Body Regular: 15px / 400 / normal  (Primary content)
Body Small:   13px / 400 / normal  (Supporting text)
Caption:      11px / 400 / normal  (Metadata)
```

### Line Height
- All text: `1.5` (optimal readability)
- Headings: `1.2` (tighter for impact)

---

## Color System

### Semantic Colors (iOS-native)
```css
--critical:    #FF3B30  /* Red - life-threatening warnings */
--warning:     #FF9500  /* Amber - important cautions */
--info:        #007AFF  /* Blue - informational */
--success:     #34C759  /* Green - positive outcomes */
--neutral:     #8E8E93  /* Gray - supplementary */
--purple:      #5856D6  /* Science/mechanism */
```

### Neutral Palette
```css
--background:  #FFFFFF  /* Page background */
--surface:     #F2F2F7  /* Card backgrounds */
--border:      #C6C6C8  /* Dividers, outlines */
--text:        #000000  /* Primary text */
--text-secondary: #8E8E93  /* Secondary text */
```

### Usage Rules
- **Critical warnings**: Red background, white text
- **Important warnings**: Amber accent, outlined cards
- **Informational**: Blue icons, subtle cards
- **Neutral content**: Gray icons, minimal styling

---

## Card System

### Card Variants

#### 1. **Subtle Card** (Default)
```css
background: #F2F2F7
border-radius: 12px
padding: 24px
shadow: none
border: none
```
**Use for**: Dosing, monitoring, references

#### 2. **Outlined Card**
```css
background: #FFFFFF
border-radius: 12px
padding: 24px
border: 1px solid #C6C6C8
shadow: none
```
**Use for**: Timelines, tapering, clinical context

#### 3. **Elevated Card**
```css
background: #FFFFFF
border-radius: 12px
padding: 24px
shadow: 0 2px 8px rgba(0,0,0,0.08)
hover: 0 4px 16px rgba(0,0,0,0.12)
```
**Use for**: Patient experiences, efficacy stats

#### 4. **Filled Warning Card**
```css
background: linear-gradient(
  to bottom,
  rgba(255, 149, 0, 0.1),
  rgba(255, 149, 0, 0.05)
)
border-radius: 12px
padding: 24px
border-left: 4px solid #FF9500
```
**Use for**: Side effects, adverse reactions

#### 5. **Filled Critical Card**
```css
background: linear-gradient(
  to bottom,
  rgba(255, 59, 48, 0.1),
  rgba(255, 59, 48, 0.05)
)
border-radius: 12px
padding: 24px
border-left: 4px solid #FF3B30
```
**Use for**: Black box warnings, critical safety

#### 6. **Outlined Critical Card**
```css
background: #FFFFFF
border-radius: 12px
padding: 24px
border: 2px solid #FF3B30
shadow: 0 0 0 4px rgba(255, 59, 48, 0.1)
```
**Use for**: Drug interactions (opioids, alcohol)

---

## Layout Patterns

### 1. **Quote Carousel** (Patient Experience)
```tsx
<div className="quote-carousel">
  {experiences.map(exp => (
    <Card variant="elevated" icon="quote.bubble.fill" color="#007AFF">
      <Category>{exp.category}</Category>
      <QuoteList>
        {exp.quotes.map(q => <Quote>"{q}"</Quote>)}
      </QuoteList>
      <Note>{exp.note}</Note>
    </Card>
  ))}
</div>
```
**Visual traits**:
- Large quotes (19px)
- Curly quotes typography
- Smooth horizontal scroll
- Fade gradient at edges

### 2. **Timeline** (Onset/Duration)
```tsx
<Timeline>
  <TimelineItem time="0-30 min" label="Administration" />
  <TimelineItem time="30-60 min" label="Onset" icon="clock.fill" />
  <TimelineItem time="1-2 hrs" label="Peak Effect" highlighted />
  <TimelineItem time="4-6 hrs" label="Duration (IR)" />
  <TimelineItem time="10-12 hrs" label="Duration (XR)" />
</Timeline>
```
**Visual traits**:
- Vertical progress line
- Blue dots for milestones
- Larger dot for peak
- Time on left, label on right

### 3. **Alert Banner** (Critical Warnings)
```tsx
<AlertBanner variant="critical" sticky={true}>
  <Icon name="exclamationmark.octagon.fill" size={24} />
  <Highlight>
    Never combine with alcohol or opioids. Risk of death.
  </Highlight>
  <BlackBox>
    {fdaBlackBoxWarning}
  </BlackBox>
  <PatientCounseling>
    {counselingPoints.map(p => <li>{p}</li>)}
  </PatientCounseling>
</AlertBanner>
```
**Visual traits**:
- Sticky to top when scrolling
- Red left border (4px)
- Attention pulse animation
- Highest z-index

### 4. **Severity List** (Side Effects)
```tsx
<SeverityList>
  <SummaryBadge>{summary}</SummaryBadge>
  <CommonEffects>
    {common.map(effect => (
      <EffectCard severity={effect.incidence}>
        <Symptom>{effect.symptom}</Symptom>
        <Incidence color="amber">{effect.incidence}</Incidence>
        <Note>{effect.patient_note}</Note>
      </EffectCard>
    ))}
  </CommonEffects>
  <CollapsibleSection label="Serious Effects (expand)">
    {serious.map(s => <SeriousEffect>{s}</SeriousEffect>)}
  </CollapsibleSection>
</SeverityList>
```
**Visual traits**:
- Color-coded by severity
- Incidence percentages prominent
- Serious effects collapsed by default
- Progressive disclosure

### 5. **Danger Cards** (Interactions)
```tsx
<DangerCards>
  {interactions.map((interaction, i) => (
    <DangerCard
      emphasized={i === 0}  // Emphasize opioids/alcohol
      variant={
        i < 2 ? "outlined-critical" : "outlined"
      }
    >
      <InteractionHeader>
        <Icon name="pills.circle.fill" />
        <Drug>{interaction.with}</Drug>
      </InteractionHeader>
      <Risk severity="critical">{interaction.risk}</Risk>
      <Action>{interaction.action}</Action>
    </DangerCard>
  ))}
</DangerCards>
```
**Visual traits**:
- First 2 cards (opioids, alcohol) outlined in red
- Remaining cards subtle
- Grid layout (2 columns on desktop)
- Hover lift effect

### 6. **Stat Card** (Efficacy)
```tsx
<StatCard>
  <Metric>
    <Number animate="count-up">50%</Number>
    <Label>panic-free at 4 weeks</Label>
  </Metric>
  <Comparison>
    <ComparisonBar>
      <Fill width="50%" color="success">Xanax</Fill>
      <Fill width="28%" color="neutral">Placebo</Fill>
    </ComparisonBar>
  </Comparison>
  <NNT>
    <Badge>NNT = 5</Badge>
    <Explanation>
      For every 5 people treated, 1 becomes panic-free
    </Explanation>
  </NNT>
</StatCard>
```
**Visual traits**:
- Large percentage (48px)
- Animated count-up on reveal
- Visual bar chart
- NNT badge (green)

### 7. **Step List** (Tapering)
```tsx
<StepList>
  {taperSteps.map((step, i) => (
    <Step number={i + 1}>
      <StepContent>{step}</StepContent>
      {i < taperSteps.length - 1 && <Connector />}
    </Step>
  ))}
</StepList>
```
**Visual traits**:
- Numbered circles (blue)
- Connecting vertical line
- Generous spacing (16px)
- Last step no connector

### 8. **Dosage Table** (Dosing)
```tsx
<DosageTable>
  <Row label="Starting Dose">
    <Value>0.25-0.5 mg</Value>
    <Frequency>2-3x daily</Frequency>
  </Row>
  <Row label="Titration">
    <Value>Increase ≤0.5 mg/day</Value>
    <Frequency>Every 3-4 days</Frequency>
  </Row>
  <Row label="Maximum">
    <Value>4 mg/day</Value>
    <Note>Higher doses require specialist</Note>
  </Row>
</DosageTable>
```
**Visual traits**:
- Clean borders (1px gray)
- Alternating row backgrounds
- Monospace for doses
- Compact layout

### 9. **Info Grid** (Special Populations)
```tsx
<InfoGrid columns={2}>
  <GridItem icon="figure.2.and.child.holdinghands">
    <Label>Pregnancy</Label>
    <Status color="critical">Category D</Status>
    <Details>{pregnancyInfo}</Details>
  </GridItem>
  <GridItem icon="drop.fill">
    <Label>Breastfeeding</Label>
    <Status color="warning">Caution</Status>
    <Details>{lactationInfo}</Details>
  </GridItem>
  <GridItem icon="figure.walk">
    <Label>Elderly</Label>
    <Status color="warning">Start Low, Go Slow</Status>
    <Details>{geriatricsInfo}</Details>
  </GridItem>
</InfoGrid>
```
**Visual traits**:
- 2-column grid (desktop)
- Icon at top
- Status badge
- Expandable details

### 10. **Checklist** (Monitoring)
```tsx
<Checklist>
  {monitoringItems.map(item => (
    <ChecklistItem>
      <Checkbox readOnly checked={false} />
      <ItemText>{item}</ItemText>
    </ChecklistItem>
  ))}
</Checklist>
```
**Visual traits**:
- iOS-style checkboxes
- Left-aligned
- 12px gap between items
- Hover highlight

---

## Icon System

### SF Symbols (Apple's Icon Set)
All icons use **SF Symbols** naming convention:

```
quote.bubble.fill          - Patient experiences
clock.fill                 - Timing/onset
checkmark.seal.fill        - Indications (approved)
exclamationmark.octagon    - Critical warnings
exclamationmark.triangle   - Warnings
chart.bar.fill             - Efficacy stats
pills.circle.fill          - Drug interactions
pills.fill                 - Dosing/formulations
chart.line.downtrend       - Tapering
person.2.fill              - Special populations
list.clipboard.fill        - Monitoring
brain.head.profile         - Mechanism
book.fill                  - Clinical context
link.circle.fill           - References
```

### Icon Rendering
```tsx
<Icon
  name="exclamationmark.octagon.fill"
  size={20}                    // Default: 20px
  weight="regular"             // Options: regular, medium, semibold
  color="inherit"              // Inherits from parent or semantic color
/>
```

---

## Animation System

### Timing Functions
```css
--ease-apple: cubic-bezier(0.4, 0.0, 0.2, 1)  /* Apple standard */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### Animation Variants

#### 1. **Fade In** (Default)
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
duration: 200ms
easing: ease-apple
```

#### 2. **Fade Slide Up** (Hero sections)
```css
@keyframes fadeSli deUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
duration: 300ms
easing: ease-apple
```

#### 3. **Attention Pulse** (Critical warnings)
```css
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 59, 48, 0);
  }
}
duration: 2000ms
easing: ease-in-out
iteration: infinite
```

#### 4. **Number Count Up** (Stats)
```tsx
// Animate from 0 to target value
<CountUp
  start={0}
  end={50}
  duration={1000}
  suffix="%"
  ease="ease-apple"
/>
```

#### 5. **Expand Collapse**
```css
@keyframes expand {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: var(--content-height);
    opacity: 1;
  }
}
duration: 300ms
easing: ease-apple
```

---

## Spacing System

### Standard Units (8px base)
```
xs:   4px   (inline elements)
sm:   8px   (compact lists)
md:   12px  (list items)
lg:   16px  (paragraphs)
xl:   24px  (card padding)
2xl:  32px  (section padding)
3xl:  40px  (section gaps)
4xl:  48px  (page margins)
```

### Section Layout
```tsx
<PageContainer padding="48px">
  <Section marginBottom="40px">
    <SectionHeader marginBottom="24px">
      <Heading>...</Heading>
    </SectionHeader>
    <SectionContent gap="12px">
      {/* Content */}
    </SectionContent>
  </Section>
</PageContainer>
```

---

## Responsive Breakpoints

```css
--mobile:   0-767px      (1 column, 20px margins)
--tablet:   768-1023px   (1-2 columns, 32px margins)
--desktop:  1024-1439px  (2-3 columns, 48px margins)
--wide:     1440px+      (max-width 1280px, centered)
```

### Responsive Grid
```css
.grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

@media (max-width: 767px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
```

---

## Dark Mode Support

### Color Mapping
```css
@media (prefers-color-scheme: dark) {
  --background:      #000000
  --surface:         #1C1C1E
  --border:          #38383A
  --text:            #FFFFFF
  --text-secondary:  #8E8E93

  /* Semantic colors stay the same */
  --critical:        #FF453A  /* Slightly lighter */
  --warning:         #FF9F0A  /* Slightly lighter */
  --info:            #0A84FF  /* Slightly lighter */
  --success:         #30D158  /* Slightly lighter */
}
```

### Shadow Adjustments
```css
@media (prefers-color-scheme: dark) {
  .card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);  /* Darker shadow */
  }
}
```

---

## Accessibility

### Contrast Ratios
- **Large text (≥18px)**: 3:1 minimum (AA)
- **Body text (<18px)**: 4.5:1 minimum (AA)
- **Critical warnings**: 7:1 (AAA)

### Focus States
```css
*:focus-visible {
  outline: 2px solid #007AFF;
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Screen Reader
```tsx
<Section aria-labelledby="warnings-heading">
  <Heading id="warnings-heading">Critical Safety Information</Heading>
  <Alert role="alert" aria-live="polite">
    {criticalWarning}
  </Alert>
</Section>
```

---

## Implementation Checklist

### For Each Section:
- [ ] Apply correct `layout` variant from ui_hints
- [ ] Use specified SF Symbol `icon`
- [ ] Apply semantic `color` from palette
- [ ] Set `visual_priority` (hero > critical > high > medium > low)
- [ ] Render with appropriate `card_style`
- [ ] Implement `animation` on mount/reveal
- [ ] Handle `collapsible` state if enabled
- [ ] Respect `ux_display` visibility rules
- [ ] Test responsive behavior
- [ ] Verify dark mode colors
- [ ] Check accessibility (focus, ARIA, contrast)

---

## Example: Complete Section Rendering

```tsx
function renderSection(section: Section) {
  const { ui_hints, type, heading, collapsible } = section;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0.0, 0.2, 1]
      }}
      className={cn(
        "section",
        `priority-${ui_hints.visual_priority}`,
        `layout-${ui_hints.layout}`
      )}
    >
      <Card variant={ui_hints.card_style}>
        <SectionHeader>
          <Icon
            name={ui_hints.icon}
            color={ui_hints.color}
            size={20}
          />
          <Heading level={2}>{heading}</Heading>
          {collapsible && <ExpandButton />}
        </SectionHeader>

        <SectionContent>
          {renderLayoutVariant(section)}
        </SectionContent>
      </Card>
    </motion.section>
  );
}
```

---

## Performance Considerations

### Lazy Loading
- Collapse non-critical sections by default
- Lazy load reference links
- Defer offscreen section rendering

### Animation Performance
- Use `transform` and `opacity` (GPU-accelerated)
- Avoid animating `width`, `height`, `margin`
- Use `will-change` sparingly

### Bundle Size
- Inline critical CSS
- Code-split SF Symbols
- Compress JSON visual metadata

---

## Quality Checklist

Before marking a page as "Apple-ready":
- [ ] Typography follows SF Pro scale exactly
- [ ] All colors use semantic palette
- [ ] Cards match variant specs (border-radius, shadow, padding)
- [ ] Icons are SF Symbols (or equivalent)
- [ ] Animations use Apple easing curves
- [ ] Spacing follows 8px grid
- [ ] Responsive across all breakpoints
- [ ] Dark mode fully supported
- [ ] WCAG AA contrast minimums met
- [ ] Focus states visible and accessible
- [ ] Screen reader announces sections properly
- [ ] No jank during expand/collapse
- [ ] Feels "native" to iOS/macOS users

---

## Visual Hierarchy Example (Xanax Page)

```
1. Hero Section (patient_summary)
   - Large text (17px)
   - Elevated card
   - Blue accent

2. Critical Warnings (warnings)
   - Sticky alert banner
   - Red accent
   - Attention pulse
   - Filled critical card

3. Patient Experience (patient_experience)
   - Quote carousel
   - Elevated cards
   - Smooth scroll

4. Timing (onset_duration)
   - Timeline layout
   - Blue icons
   - Outlined card

5. Side Effects (adverse_effects)
   - Severity list
   - Amber accent
   - Filled warning card
   - Progressive disclosure

6. Drug Interactions (interactions)
   - Danger cards
   - Red accent
   - First 2 emphasized

7. Supporting Content (efficacy, dosing, etc.)
   - Subtle cards
   - Gray accents
   - Collapsed by default
```

---

## Resources

### Design References
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [SF Symbols Browser](https://developer.apple.com/sf-symbols/)
- [iOS Color System](https://developer.apple.com/design/human-interface-guidelines/color)

### Code Examples
- See `/src/components/medication/` for reference implementations
- Storybook: `npm run storybook` → "Medication Sections"

---

## Questions?

For design decisions or implementation help:
- Design system: `docs/DESIGN_SYSTEM.md`
- Component API: `docs/COMPONENTS.md`
- Accessibility: `docs/A11Y.md`
