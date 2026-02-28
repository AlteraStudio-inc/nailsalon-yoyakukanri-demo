const fs = require('fs');

let css = fs.readFileSync('lp.css', 'utf8');

if (!css.includes('.showcase-mobile-mockup { margin: 0 auto; }')) {
    const mobileFix = `
/* --- Mobile Fix for Mobile Admin Showcase --- */
@media (max-width: 900px) {
    .showcase-mobile-mockup {
        margin: 0 auto;
        transform: scale(0.9);
        transform-origin: top center;
    }
    .feature-row, .feature-row.reverse {
        gap: 40px !important;
    }
    .feature-image {
        width: 100%;
    }
}
@media (max-width: 480px) {
    .showcase-mobile-mockup {
        transform: scale(0.85);
    }
}
`;
    fs.appendFileSync('lp.css', mobileFix);
    console.log('Appended mobile layout fixes to lp.css');
} else {
    console.log('Mobile layout fixes already present.');
}
