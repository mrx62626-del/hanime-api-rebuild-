<p align="center">
    <a href="https://github.com/senpaiorbit/hanime-api-rebuild-">
        <img 
            src="https://i.ibb.co/LDzfJYvj/1000016627-removebg-preview.png" 
            alt="anime_api_logo" 
            width="175" 
            height="175"
            decoding="async"
            fetchpriority="high"
        />
    </a>
</p>

# <p align="center">Anime API (Multi-Provider)</p>

<div align="center">
    A free RESTful API serving anime information from multiple providers

  <br/>

  <div>
    <a 
      href="https://github.com/senpaiorbit/hanime-api-rebuild-/issues/new?assignees=&labels=bug&template=bug-report.yml"
    > 
      Bug report
    </a>
    ·
    <a 
      href="https://github.com/senpaiorbit/hanime-api-rebuild-/issues/new?assignees=&labels=enhancement&template=feature-request.md"
    >
      Feature request
    </a>
      ·
    <a 
      href="https://github.com/senpaiorbit/hanime-api-rebuild-/issues/new?assignees=&labels=enhancement&template=more-provider.md"
    >
      More Provider
    </a>
  </div>
</div>

<br/>

<div align="center">

[![GitHub License](https://img.shields.io/github/license/senpaiorbit/hanime-api-rebuild-?logo=github&logoColor=%23959da5&labelColor=%23292e34&color=%2331c754)](https://github.com/senpaiorbit/hanime-api-rebuild-/blob/main/LICENSE)

</div>

<div align="center">

[![stars](https://img.shields.io/github/stars/senpaiorbit/hanime-api-rebuild-?style=social)](https://github.com/senpaiorbit/hanime-api-rebuild-/stargazers)
[![forks](https://img.shields.io/github/forks/senpaiorbit/hanime-api-rebuild-?style=social)](https://github.com/senpaiorbit/hanime-api-rebuild-/network/members)
[![issues](https://img.shields.io/github/issues/senpaiorbit/hanime-api-rebuild-?style=social&logo=github)](https://github.com/senpaiorbit/hanime-api-rebuild-/issues?q=is%3Aissue+is%3Aopen+)

</div>

> [!IMPORTANT]
>
> 1. There was previously a hosted version of this API for showcasing purposes only, and it was misused; since then, there have been no other hosted versions. It is recommended to deploy your own instance for personal use by customizing the API as you need it to be.
> 2. This API is just an unofficial API for anime streaming sites and is in no other way officially related to the same.
> 3. The content that this API provides is not mine, nor is it hosted by me. These belong to their respective owners. This API just demonstrates how to build an API that scrapes websites and uses their content.

## Table of Contents

- [Installation](#installation)
    - [Local](#local)
    - [Vercel](#vercel)
- [Configuration](#%EF%B8%8Fconfiguration)
    - [Environment Variables](#environment-variables)
- [Providers](#providers)
    - [Anikoto](#anikoto)
    - [Anikai](#anikai)
- [Documentation](#documentation)
    - [GET Home Page](#get-home-page)
    - [GET Index/Landing Page](#get-indexlanding-page)
    - [GET Nav Menu](#get-nav-menu)
    - [GET Anime Details](#get-anime-details)
    - [GET Anime Episodes](#get-anime-episodes)
    - [GET Single Episode](#get-single-episode)
    - [GET Search Results](#get-search-results)
    - [GET Browse/Filter](#get-browsefilter)
    - [GET A-Z List](#get-a-z-list)
    - [GET Genre Animes](#get-genre-animes)
    - [GET Category Animes](#get-category-animes)
    - [GET Type Animes](#get-type-animes)
- [Development](#development)
- [Contributors](#contributors)
- [Thanks](#thanks)
- [Support](#support)
- [License](#license)

## <span id="installation">💻 Installation</span>

### Local

1. Clone the repository and move into the directory.

    ```bash
    git clone https://github.com/senpaiorbit/hanime-api-rebuild-.git
    cd hanime-api-rebuild-
    ```

2. Install all the dependencies.

    ```bash
    npm i # or yarn install or pnpm i
    ```

3. Start the server!

    ```bash
    npm start # or yarn start or pnpm start
    ```

    Now the server should be running on [http://localhost:3000](http://localhost:3000)

### Vercel

Deploy your own instance on Vercel.

> [!NOTE]
>
> When deploying to Vercel, the API uses Edge Runtime for optimal performance.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/senpaiorbit/hanime-api-rebuild-)

## <span id="configuration">⚙️ Configuration</span>

### Environment Variables

- `API_PORT`: Port number of the API (default: 3000).
- `API_DEPLOYMENT_ENV`: Deployment environment. Possible values: `'vercel' | 'nodejs'`.
- `DEFAULT_PROVIDER`: Default provider to use when none specified. Possible values: `'anikoto' | 'anikai'`.

## <span id="providers">🔌 Providers</span>

The API supports multiple anime providers. Specify the provider in the URL path.

### Anikoto

| Property | Value |
|----------|-------|
| **Base URL** | `https://anikototv.to` |
| **API Base** | `https://anikotoapi.site` |
| **Route prefix** | `/api/v2/anikoto` |

### Anikai

| Property | Value |
|----------|-------|
| **Base URL** | `https://anikai.to` |
| **Route prefix** | `/api/v2/anikai` |

## <span id="documentation">📚 Documentation</span>

All endpoints support two modes:
- **Provider-prefixed**: `/api/v2/{provider}/...` (recommended)
- **Shorthand**: `/api/...` (uses `DEFAULT_PROVIDER` or `?provider=` query param)

---

### `GET` Home Page

#### Endpoint

```bash
/api/v2/{provider}/home
```

Request Sample

```javascript
const resp = await fetch("/api/v2/anikoto/home");
const data = await resp.json();
console.log(data);
```

Response Schema

```javascript
{
  success: true,
  data: {
    genres: ["Action", "Adventure", "Comedy", "Drama", ...],
    spotlightAnimes: [
      {
        id: string,
        name: string,
        jname: string,
        poster: string,
        description: string,
        rating: string,
        rank: number,
        otherInfo: string[],
        genres: string[],
        episodes: {
          sub: number | null,
          dub: number | null
        }
      },
      {...}
    ],
    latestEpisodeAnimes: [
      {
        id: string,
        name: string,
        jname: string | null,
        poster: string,
        type: string | null,
        episodes: {
          sub: number | null,
          dub: number | null
        }
      },
      {...}
    ],
    newReleases: [
      {
        id: string,
        name: string,
        poster: string,
        type: string | null,
        episodes: {
          sub: number | null,
          dub: number | null
        }
      },
      {...}
    ],
    topUpcomingAnimes: [...],
    top10Animes: {
      today: [
        {
          id: string,
          name: string,
          poster: string,
          rank: number,
          episodes: {
            sub: number | null,
            dub: number | null
          }
        },
        {...}
      ],
      day: [...],
      week: [...],
      month: [...]
    }
  }
}
```

🔼 Back to Top

---

GET Index/Landing Page

Returns meta information, most-searched links, A-Z list, and footer menu from the landing page.

Endpoint

```bash
/api/v2/{provider}/index
```

Request Sample

```javascript
const resp = await fetch("/api/v2/anikoto/index");
const data = await resp.json();
console.log(data);
```

Response Schema

```javascript
{
  success: true,
  data: {
    meta: {
      title: string,
      description: string,
      ogImage: string,
      canonical: string
    },
    mostSearched: [
      {
        label: string,
        keyword: string
      },
      {...}
    ],
    genres: ["Action", "Adventure", ...],
    azList: [
      { label: "All", href: "/az-list/" },
      { label: "0-9", href: "/az-list/0-9" },
      { label: "A", href: "/az-list/A" },
      ...
    ],
    footerMenu: [
      { label: "DMCA", href: "/pages/dmca" },
      { label: "Terms of Use", href: "/pages/terms" },
      { label: "Contact", href: "/contact" }
    ]
  }
}
```

🔼 Back to Top

---

GET Nav Menu

Returns the full navigation structure (genres, types, links, browse filters).

Endpoint

```bash
/api/v2/{provider}/nav
```

Request Sample

```javascript
const resp = await fetch("/api/v2/anikoto/nav");
const data = await resp.json();
console.log(data);
```

Response Schema

```javascript
{
  success: true,
  data: {
    header: {
      brand: {
        link: string,
        logo: string
      },
      buttons: {
        menu: boolean,
        search: boolean,
        watch2gether: string | null,
        random: string | null
      },
      search: {
        action: string,
        placeholder: string,
        filter_link: string
      },
      menu: {
        genres: [
          { name: "Action", url: "/api/v2/anikoto/genre/action" },
          { name: "Adventure", url: "/api/v2/anikoto/genre/adventure" },
          ...
        ],
        types: [
          { name: "Movie", url: "/api/v2/anikoto/type/movie" },
          { name: "TV", url: "/api/v2/anikoto/type/tv" },
          ...
        ],
        links: [
          { name: "Home", url: "/api/v2/anikoto/home" },
          { name: "Updated", url: "/api/v2/anikoto/category/latest-updated" },
          { name: "Popular", url: "/api/v2/anikoto/category/most-viewed" },
          ...
        ]
      },
      browse: {
        url: "/api/v2/anikoto/browse",
        sortOptions: [
          { label: "Default", value: "default" },
          { label: "Latest Updated", value: "latest-updated" },
          { label: "Score", value: "score" },
          { label: "Name A-Z", value: "name-az" },
          { label: "Most Viewed", value: "most-viewed" },
          ...
        ],
        filters: {
          type: ["Movie", "Music", "ONA", "OVA", "Special", "TV"],
          status: ["finished-airing", "currently-airing", "not-yet-aired"],
          season: ["fall", "summer", "spring", "winter"],
          rating: ["PG", "PG-13", "G", "R", "R+", "Rx"],
          language: ["sub", "dub"]
        }
      }
    }
  }
}
```

🔼 Back to Top

---

GET Anime Details

Endpoint

```bash
/api/v2/{provider}/anime/{animeId}
```

Path Parameters

Parameter Type Description Required? Default
animeId string The unique anime id (can be numeric or slug). Yes --

Request Sample

```javascript
// Numeric ID (anikoto)
const resp = await fetch("/api/v2/anikoto/anime/6957");
const data = await resp.json();
console.log(data);

// Slug (anikai)
const resp = await fetch("/api/v2/anikai/anime/one-piece-100");
const data = await resp.json();
console.log(data);
```

Response Schema

```javascript
{
  success: true,
  data: {
    anime: {
      id: string,
      animeId: string,
      name: string,
      jname: string | null,
      synonyms: string | null,
      japanese: string | null,
      poster: string,
      description: string,
      type: string | null,
      rating: string | null,
      episodes: {
        sub: number | null,
        dub: number | null
      },
      duration: string | null,
      premiered: string | null,
      aired: string | null,
      broadcast: string | null,
      status: string | null,
      score: string | null,
      episodesTotal: number | null,
      country: string | null,
      genres: string[],
      studios: string[],
      producers: string[],
      malId: string | null,
      alId: string | null
    },
    related: [
      {
        id: string,
        name: string,
        jname: string | null,
        poster: string,
        type: string | null,
        relationType: string | null,
        episodes: {
          sub: number | null,
          dub: number | null
        }
      },
      {...}
    ],
    recommended: [
      {
        id: string,
        name: string,
        poster: string,
        type: string | null,
        episodes: {
          sub: number | null,
          dub: number | null
        }
      },
      {...}
    ],
    seasons: [
      {
        id: string,
        label: string,
        episodes: string,
        poster: string,
        isCurrent: boolean
      },
      {...}
    ]
  }
}
```

🔼 Back to Top

---

GET Anime Episodes

Returns all episodes with streaming source URLs.

Endpoint

```bash
/api/v2/{provider}/anime/{animeId}/episodes
```

Path Parameters

Parameter Type Description Required? Default
animeId string The unique anime id. Yes --

Request Sample

```javascript
const resp = await fetch("/api/v2/anikoto/anime/6957/episodes");
const data = await resp.json();
console.log(data);
```

Response Schema

```javascript
{
  success: true,
  data: {
    totalEpisodes: 13,
    malId: "51096",
    alId: "145545",
    episodes: [
      {
        number: 1,
        title: "Remember to Keep a Clear Head in Difficult Times",
        isFiller: false,
        hasSub: true,
        hasDub: true,
        sources: {
          sub: "https://megaplay.buzz/stream/s-2/92595/sub",
          dub: "https://megaplay.buzz/stream/s-2/92595/dub",
          aniSub: "https://megaplay.buzz/stream/ani/145545/1/sub",
          aniDub: "https://megaplay.buzz/stream/ani/145545/1/dub"
        }
      },
      {...}
    ]
  }
}
```

🔼 Back to Top

---

GET Single Episode

Returns a single episode by number with streaming source URLs.

Endpoint

```bash
/api/v2/{provider}/anime/{animeId}/ep/{number}
```

Path Parameters

Parameter Type Description Required? Default
animeId string The unique anime id. Yes --
number number The episode number. Yes --

Request Sample

```javascript
const resp = await fetch("/api/v2/anikoto/anime/6957/ep/1");
const data = await resp.json();
console.log(data);
```

Response Schema

```javascript
{
  success: true,
  data: {
    malId: "51096",
    alId: "145545",
    episode: {
      number: 1,
      title: "Remember to Keep a Clear Head in Difficult Times",
      isFiller: false,
      hasSub: true,
      hasDub: true,
      sources: {
        sub: "https://megaplay.buzz/stream/s-2/92595/sub",
        dub: "https://megaplay.buzz/stream/s-2/92595/dub",
        aniSub: "https://megaplay.buzz/stream/ani/145545/1/sub",
        aniDub: "https://megaplay.buzz/stream/ani/145545/1/dub"
      }
    }
  }
}
```

🔼 Back to Top

---

GET Search Results

Endpoint

```bash
/api/v2/{provider}/search?q={query}&page={page}&sort={sort}&type[]={type}&genre[]={genre}&status[]={status}&season[]={season}&year[]={year}&rating[]={rating}&language[]={language}
```

Query Parameters

Parameter Type Description Required? Default
q string The search query, i.e. the title of the item you are looking for. Yes --
page number The page number of the result. No 1
sort string Sort order. Values: default, latest-updated, latest-added, score, name-az, release-date, most-viewed, number_of_episodes No --
type[] string Type filter. eg: TV, Movie, OVA, ONA, Special No --
genre[] string Genre filter (slug or numeric ID). eg: action, drama, 47 No --
status[] string Status filter. Values: finished-airing, currently-airing, not-yet-aired No --
season[] string Season filter. Values: fall, summer, spring, winter No --
year[] string Year filter. eg: 2022, 2023, 2024 No --
rating[] string Rating filter. Values: PG, PG-13, G, R, R+, Rx No --
language[] string Language filter. Values: sub, dub No --

Request Sample

```javascript
// Basic search
const resp = await fetch("/api/v2/anikoto/search?q=classroom&page=1");
const data = await resp.json();
console.log(data);

// Advanced search with filters
const resp = await fetch(
    "/api/v2/anikoto/search?q=elite&type[]=TV&genre[]=drama&status[]=finished-airing&sort=score&year[]=2022"
);
const data = await resp.json();
console.log(data);
```

Response Schema

```javascript
{
  success: true,
  data: {
    animes: [
      {
        id: string,
        name: string,
        jname: string | null,
        poster: string,
        type: string | null,
        episodes: {
          sub: number | null,
          dub: number | null
        }
      },
      {...}
    ],
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    totalCount: number | null,
    searchQuery: string,
    searchFilters: {}
  }
}
```

🔼 Back to Top

---

GET Browse/Filter

Browse anime with any combination of filters. Same parameters as search but keyword is optional.

Endpoint

```bash
/api/v2/{provider}/browse?page={page}&sort={sort}&keyword={keyword}&type[]={type}&genre[]={genre}&status[]={status}&season[]={season}&year[]={year}&rating[]={rating}&language[]={language}
```

Query Parameters

Parameter Type Description Required? Default
keyword string Optional text search keyword. No --
page number The page number of the result. No 1
sort string Sort order. Values: default, latest-updated, latest-added, score, name-az, release-date, most-viewed, number_of_episodes No default
type[] string Type filter. eg: TV, Movie No --
genre[] string Genre filter (slug or numeric ID). eg: action, drama No --
status[] string Status filter. Values: finished-airing, currently-airing, not-yet-aired No --
season[] string Season filter. Values: fall, summer, spring, winter No --
year[] string Year filter. eg: 2022, 2023 No --
rating[] string Rating filter. Values: PG, PG-13, G, R, R+, Rx No --
language[] string Language filter. Values: sub, dub No --

Request Sample

```javascript
// Browse all TV anime sorted by score
const resp = await fetch("/api/v2/anikoto/browse?type[]=TV&sort=score&page=1");
const data = await resp.json();
console.log(data);

// Browse action genre from summer 2022
const resp = await fetch(
    "/api/v2/anikoto/browse?genre[]=action&season[]=summer&year[]=2022&status[]=finished-airing"
);
const data = await resp.json();
console.log(data);
```

Response Schema

```javascript
{
  success: true,
  data: {
    animes: [
      {
        id: string,
        name: string,
        jname: string | null,
        poster: string,
        type: string | null,
        episodes: {
          sub: number | null,
          dub: number | null
        }
      },
      {...}
    ],
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    totalCount: number | null,
    filters: {
      type: [...],
      genre: [...],
      ...
    }
  }
}
```

🔼 Back to Top

---

GET A-Z List

Endpoint

```bash
/api/v2/{provider}/azlist/{sortOption}?page={page}
```

Path Parameters

Parameter Type Description Required? Default
sortOption string The az-list sort option. Possible values: "all", "other", "0-9" and all english alphabets (A-Z). Yes --

Query Parameters

Parameter Type Description Required? Default
page number The page number of the result. No 1

Request Sample

```javascript
const resp = await fetch("/api/v2/anikoto/azlist/A?page=1");
const data = await resp.json();
console.log(data);
```

Response Schema

```javascript
{
  success: true,
  data: {
    sortOption: "A",
    animes: [
      {
        id: string,
        name: string,
        jname: string | null,
        poster: string,
        type: string | null,
        episodes: {
          sub: number | null,
          dub: number | null
        }
      },
      {...}
    ],
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false
  }
}
```

🔼 Back to Top

---

GET Genre Animes

Endpoint

```bash
/api/v2/{provider}/genre/{name}?page={page}&sort={sort}
```

Path Parameters

Parameter Type Description Required? Default
name string The name of anime genre (in kebab case). Yes --

Query Parameters

Parameter Type Description Required? Default
page number The page number of the result. No 1
sort string Sort order for results. No --

Request Sample

```javascript
const resp = await fetch("/api/v2/anikoto/genre/action?page=1");
const data = await resp.json();
console.log(data);
```

Response Schema

```javascript
{
  success: true,
  data: {
    genreName: "Action",
    animes: [
      {
        id: string,
        name: string,
        jname: string | null,
        poster: string,
        type: string | null,
        episodes: {
          sub: number | null,
          dub: number | null
        }
      },
      {...}
    ],
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false
  }
}
```

🔼 Back to Top

---

GET Category Animes

Endpoint

```bash
/api/v2/{provider}/category/{name}?page={page}&sort={sort}
```

Path Parameters

Parameter Type Description Required? Default
name string The category name. Possible values: new-release, latest-updated, most-viewed, completed, ongoing, upcoming, movie, tv, ova, ona, special Yes --

Query Parameters

Parameter Type Description Required? Default
page number The page number of the result. No 1
sort string Sort order for results. No --

Request Sample

```javascript
const resp = await fetch("/api/v2/anikoto/category/tv?page=2");
const data = await resp.json();
console.log(data);
```

Response Schema

```javascript
{
  success: true,
  data: {
    category: "TV",
    animes: [
      {
        id: string,
        name: string,
        jname: string | null,
        poster: string,
        type: string | null,
        episodes: {
          sub: number | null,
          dub: number | null
        }
      },
      {...}
    ],
    currentPage: 2,
    totalPages: 10,
    hasNextPage: true
  }
}
```

🔼 Back to Top

---

GET Type Animes

Endpoint

```bash
/api/v2/{provider}/type/{name}?page={page}&sort={sort}
```

Path Parameters

Parameter Type Description Required? Default
name string The type name. Possible values: movie, tv, ova, ona, special, music Yes --

Query Parameters

Parameter Type Description Required? Default
page number The page number of the result. No 1
sort string Sort order for results. No --

Request Sample

```javascript
const resp = await fetch("/api/v2/anikoto/type/movie?page=1");
const data = await resp.json();
console.log(data);
```

Response Schema

```javascript
{
  success: true,
  data: {
    type: "Movie",
    animes: [
      {
        id: string,
        name: string,
        jname: string | null,
        poster: string,
        type: string | null,
        episodes: {
          sub: number | null,
          dub: number | null
        }
      },
      {...}
    ],
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false
  }
}
```

🔼 Back to Top

---

<span id="shorthand-routes">🔗 Shorthand Routes</span>

Shorthand routes use the default provider (anikoto) or can accept a ?provider= query parameter.

```bash
# Uses default provider
/api/home
/api/anime/6957
/api/anime/6957/episodes
/api/anime/6957/ep/1
/api/search?q=classroom
/api/browse?type[]=TV
/api/genre/action
/api/category/tv
/api/type/movie
/api/azlist/A
/api/nav
/api/index

# Specify provider
/api/home?provider=anikai
/api/anime/6957?provider=anikai
/api/search?q=classroom&provider=anikai
```

🔼 Back to Top

---

<span id="development">👨‍💻 Development</span>

Pull requests and stars are always welcome. If you encounter any bug or want to add a new feature to this api, consider creating a new issue. If you wish to contribute to this project, read the CONTRIBUTING.md file.

<span id="contributors">✨ Contributors</span>

Thanks to the following people for keeping this project alive and relevant.

https://contrib.rocks/image?repo=senpaiorbit/hanime-api-rebuild-

<span id="thanks">🤝 Thanks</span>

· consumet.ts
· api.consumet.org
· @itzzzme
· @Ciarands

<span id="support">🙌 Support</span>

Don't forget to leave a star 🌟.

<span id="license">📜 License</span>

This project is licensed under the MIT License - see the LICENSE file for more details.

```

---

This README now reflects the new multi-provider API with anikoto and anikai support, keeping the same structure as the original but updated with:

- New endpoint paths with `{provider}` parameter
- Anikoto/anikai provider documentation
- JSON-based anime details with episode streaming sources
- Browse/filter endpoint with all filter combinations
- Shorthand routes for backward compatibility
