# Ge-vendor-de biblioteke (geen bou-stap, geen CDN)

| Lêer | Bron | Lisensie | SHA-384 (integrity) |
|---|---|---|---|
| echarts-6.1.0.min.js | npm `echarts@6.1.0` `dist/echarts.min.js` | Apache-2.0 (LICENSES/echarts-LICENSE.txt) | sha384-C2iskrW/uPW46KzOjrvJIQo4YkV8lkD+QS0CrDN18IIPIpT/g2USu8bTP3nvmIAD |
| motion-14.1.0.js | npm `motion@14.1.0` `dist/motion.js` | MIT (LICENSES/motion-LICENSE.md) | sha384-FpYOvvj1o1Sqndyu6Vr6Br51rLTjr7Jfdoh93bJ/KHTRpGlif7cwAM4nIxt19cxV |

Herbereken: `openssl dgst -sha384 -binary <lêer> | openssl base64 -A`. Die toets `tests/e2e/pa-konsole-v2.spec.js` ("integrity") kontroleer dat pa-konsole.html se integrity-waardes ooreenstem.
