# Add the Blue Pair logo throughout the app

## What will change
- Store the uploaded Blue Pair logo as the shared brand image.
- Replace the text-only marks in the public navigation and every portal header with the logo, sized appropriately for desktop and mobile.
- Add the logo to guest sign-in, guest registration, and staff sign-in screens without changing their forms or behavior.
- Create matching favicon, Apple touch icon, and 192px/512px app icons from the same artwork, then update the installable-app manifest and page metadata.

## Technical details
- Use the CDN-backed uploaded image for in-page logos.
- Keep real optimized icon files under `public/` where browsers and installed apps require them.
- Update the existing PWA cache list so the icon assets are available consistently.
- Preserve current layout, authentication, navigation, and permissions behavior.

## Verification
- Confirm the public header, a portal header, guest authentication, and staff authentication at desktop and mobile sizes.
- Check the generated manifest/icon references and the latest preview build status.
