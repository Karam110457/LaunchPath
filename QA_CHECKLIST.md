# QA Checklist

## Functional
- [ ] **Form Submission**: Submitting a valid email adds a row to Supabase `waitlist` table.
- [ ] **Validation**: Invalid emails show an error message.
- [ ] **Empty State**: Submitting empty form shows an error.
- [ ] **Success State**: After submission, form is replaced by success message.
- [ ] **Duplicate Email**: Submitting the same email twice shows "You're already on the list" (handled by unique constraint).
- [ ] **Honeypot**: Filling the hidden `confirm_email` field (simulating a bot) results in a silent success without DB insert.
- [ ] **Rate Limit**: Spamming the submit button triggers rate limit error (after 5 attempts/min).

## Visual / UI
- [ ] **Mobile Responsiveness**:
    - Hero text scales down correctly on iPhone SE/Pixel.
    - Padding is comfortable on small screens.
    - "The Loop" cards stack vertically.
    - "One System" steps stack vertically.
- [ ] **Dark Mode**:
    - Background is dark (oklch(0.10 0 0)).
    - Text contrast is accessible.
    - No white flashes on load.
- [ ] **Animations**:
    - Elements fade in smoothly.
    - No layout shifts during loading.

## Performance
- [ ] **Lighthouse Score**: Aim for 90+ on Performance, Accessibility, Best Practices, SEO.
- [ ] **Fonts**: `Geist` and `Playfair Display` load correctly (no FOUT).
