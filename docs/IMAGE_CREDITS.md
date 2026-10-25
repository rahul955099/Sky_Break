# Image credits and replacement

## Company logo

`client/public/brand/skybreak-infra-logo.png` is the official Skybreak Infra Pvt Ltd logo supplied by the company. The other files in `client/public/brand/` are cropped or downscaled copies of it (see README → "Brand assets and logo"). It is the company's own trademark artwork, not stock imagery.

## Photography

All photography is loaded from **Unsplash** (`images.unsplash.com`) under the [Unsplash License](https://unsplash.com/license), which permits free commercial use without attribution. Each photo can be viewed at `https://unsplash.com/photos/<id>` — search by the ID below.

Before launch, the best result is to replace stock imagery with photographs of real Skybreak Infra sites and completed work.

## Where images are referenced

| Location | Purpose |
| -------- | ------- |
| `client/src/data/images.ts` | Hero, about, CTA, contact and process page images, 3D fallback |
| `client/src/data/content.ts` | Process timeline images |
| `server/prisma/seed-data.ts` | Service hero images and sample project covers/galleries (database seed) |
| `client/src/lib/config.ts` | Default social share (Open Graph) image |

Images stored in the database (services and projects) are edited in the admin dashboard — you can paste a URL or upload a file.

## Photo IDs in use

| Unsplash photo ID | Subject | Used for |
| ----------------- | ------- | -------- |
| 1487958449943-2429e8be8625 | Angular white building | Home hero, OG image, process |
| 1600596542815-ffad4c1539a9 | White villa with terraces and pool | Home intro, sample villa |
| 1503387762-592deb58ef4e | Architectural plans on desk | Intro, complete solutions service, process |
| 1479839672679-a46483c0e7c8 | White modular facade | 3D fallback, sample development |
| 1515263487990-61b07816b324 | Modern apartment facade | About hero, sample development |
| 1504307651254-35680f356dfd | Workers tying reinforcement | Quality section, civil service, process |
| 1600566753190-17f0baa2a6c3 | Timber-clad contemporary house | Sustainability, sample homes |
| 1431576901776-e539bd916ba2 | Glass towers from below | CTA band |
| 1497366811353-6870744d04b2 | Office with glass meeting room | Contact, office service, sample office |
| 1429497419816-9ca5cfb4571a | Tower cranes | Process hero, development service |
| 1600585154340-be6161a56a0c | Modern house at dusk | Residential service, sample homes, process |
| 1613490493576-7fde63acd811 | Luxury villa with pool | Villas service, sample villa |
| 1460317442991-0ec209397118 | Apartment balconies | Apartments service |
| 1464938050520-ef2270bb8ce8 | Commercial towers | Commercial service |
| 1517581177682-a085bb7ffb15 | Renovation in progress | Renovation service, sample renovation |
| 1600573472550-8090b5e0745e, 1600607687939-ce8a6c25118c, 1512917774080-9991f1c4c750 | Villa interiors / terrace | Sample villa gallery |
| 1484154218962-a197022b5858, 1600047509807-ba8f99d2cdde | Kitchen, timber house | Sample homes gallery |
| 1574362848149-11496d93a7c7, 1545324418-cc1a3fa10c00, 1567684014761-b65e2e59b9eb, 1600210492486-724fe5c67fb0 | Apartment complex, facades, interior | Sample residences |
| 1486406146926-c627a92ad1ab, 1531973576160-7125cd663d86, 1497366216548-37526070297c | Towers, offices | Sample business centre |
| 1441986300917-64674bd600d8, 1448630360428-65456885c650, 1524758631624-e2822e304c36 | Retail, facade, lounge | Sample retail |
| 1553413077-190dd305871c, 1586528116311-ad8dd3c8310d, 1541888946425-d81bb19240f5 | Warehouses, construction site | Sample logistics hub |
| 1534237710431-e2fc698436d0 | Twin residential towers | Sample development |
| 1513694203232-719a280e022f, 1600566752355-35792bedcfea, 1600607687644-c7171b42498f | Renovated interiors | Sample renovation |

All IDs were checked to resolve (HTTP 200) and visually reviewed for relevance when the site was built.

## 3D model

The interactive 3D building on the home page is generated procedurally in code (`client/src/three/BuildingScene.tsx`). It uses no external models, textures or HDR files, so there are no third-party 3D asset licences to track.
