<p align="center">
    <a href="https://github.com/senpaiorbit/hanime-api-rebuild-">
        <img 
            src="https://w7.pngwing.com/pngs/330/89/png-transparent-anime-girl-chibi-anime-girl-blue-haired-girl-illustration-black-hair-cartoons-cartoon-thumbnail.png" 
            alt="hanime_logo" 
            width="175" 
            height="175"
            decoding="async"
            fetchpriority="high"
        />
    </a>
</p>

# <p align="center">HiAnime API (Rebuild)</p>

<div align="center">
    A free RESTful API serving anime information from <a href="https://hianime.re" target="_blank">hianime.re</a>

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
> 2. This API is just an unofficial API for [hianime.re](https://hianime.re) and is in no other way officially related to the same.
> 3. The content that this API provides is not mine, nor is it hosted by me. These belong to their respective owners. This API just demonstrates how to build an API that scrapes websites and uses their content.

## Table of Contents

- [Installation](#installation)
    - [Local](#local)
    - [Vercel](#vercel)
- [Configuration](#%EF%B8%8Fconfiguration)
    - [Environment Variables](#environment-variables)
- [Host your instance](#host-your-instance)
    - [Vercel](#vercel)
- [Documentation](#documentation)
    - [GET Anime Home Page](#get-anime-home-page)
    - [GET Anime A-Z List](#get-anime-a-z-list)
    - [GET Anime Qtip Info](#get-anime-qtip-info)
    - [GET Anime About Info](#get-anime-about-info)
    - [GET Search Results](#get-search-results)
    - [GET Search Suggestions](#get-search-suggestions)
    - [GET Producer Animes](#get-producer-animes)
    - [GET Genre Animes](#get-genre-animes)
    - [GET Category Animes](#get-category-animes)
    - [GET Estimated Schedules](#get-estimated-schedules)
    - [GET Anime Episodes](#get-anime-episodes)
    - [GET Anime Episode Servers](#get-anime-episode-servers)
    - [GET Anime Episode Streaming Links](#get-anime-episode-streaming-links)
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

- `HANIME_API_PORT`: Port number of the API (default: 3000).
- `HANIME_API_DEPLOYMENT_ENV`: Deployment environment. Possible values: `'vercel' | 'nodejs'`.

## <span id="host-your-instance">⛅ Host your instance</span>

### Vercel

Deploy your own instance of HiAnime API on Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/senpaiorbit/hanime-api-rebuild-)

## <span id="documentation">📚 Documentation</span>

The endpoints exposed by the API are listed below with examples that use the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), but you can use any HTTP library.

### `GET` Anime Home Page

#### Endpoint

```bash
/api/v2/hianime/home
```

#### Request Sample

```javascript
const resp = await fetch("/api/v2/hianime/home");
const data = await resp.json();
console.log(data);
```

#### Response Schema

```javascript
{
  success: true,
  data: {
    genres: ["Action", "Cars", "Adventure", ...],
    latestEpisodeAnimes: [
      {
        id: string,
        name: string,
        poster: string,
        type: string,
        episodes: {
          sub: number,
          dub: number,
        }
      },
      {...},
    ],
    spotlightAnimes: [
      {
        id: string,
        name: string,
        jname: string,
        poster: string,
        description: string,
        rank: number,
        otherInfo: string[],
        episodes: {
          sub: number,
          dub: number,
        },
      },
      {...},
    ],
    top10Animes: {
      today: [
        {
          episodes: {
            sub: number,
            dub: number,
          },
          id: string,
          name: string,
          poster: string,
          rank: number
        },
        {...},
      ],
      month: [...],
      week: [...]
    },
    topAiringAnimes: [
      {
        id: string,
        name: string,
        jname: string,
        poster: string,
      },
      {...},
    ],
    topUpcomingAnimes: [
      {
        id: string,
        name: string,
        poster: string,
        duration: string,
        type: string,
        rating: string,
        episodes: {
          sub: number,
          dub: number,
        }
      },
      {...},
    ],
    trendingAnimes: [
      {
        id: string,
        name: string,
        poster: string,
        rank: number,
      },
      {...},
    ],
    mostPopularAnimes: [
      {
        id: string,
        name: string,
        poster: string,
        type: string,
        episodes: {
          sub: number,
          dub: number,
        }
      },
      {...},
    ],
    mostFavoriteAnimes: [
      {
        id: string,
        name: string,
        poster: string,
        type: string,
        episodes: {
          sub: number,
          dub: number,
        }
      },
      {...},
    ],
    latestCompletedAnimes: [
      {
        id: string,
        name: string,
        poster: string,
        type: string,
        episodes: {
          sub: number,
          dub: number,
        }
      },
      {...},
    ],
  }
}
```

[🔼 Back to Top](#table-of-contents)

### `GET` Anime A-Z List

#### Endpoint

```sh
/api/v2/hianime/azlist/{sortOption}?page={page}
```

#### Path Parameters

|  Parameter   |  Type  |                                             Description                                             | Required? | Default |
| :----------: | :----: | :-------------------------------------------------------------------------------------------------: | :-------: | :-----: |
| `sortOption` | string | The az-list sort option. Possible values include: "all", "other", "0-9" and all english alphabets . |    Yes    |   --    |

#### Query Parameters

| Parameter |  Type  |          Description           | Required? | Default |
| :-------: | :----: | :----------------------------: | :-------: | :-----: |
|  `page`   | number | The page number of the result. |    No     |   `1`   |

#### Request Sample

```javascript
const resp = await fetch("/api/v2/hianime/azlist/0-9?page=1");
const data = await resp.json();
console.log(data);
```

#### Response Schema

```javascript
{
  success: true,
  data: {
    sortOption: "0-9",
    animes: [
      {
        id: string,
        name: string,
        jname: string,
        poster: string,
        duration: string,
        type: string,
        rating: string,
        episodes: {
          sub: number,
          dub: number
        }
      },
      {...}
    ],
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false
  }
}
```

[🔼 Back to Top](#table-of-contents)

### `GET` Anime Qtip Info

#### Endpoint

```sh
/api/v2/hianime/qtip/{animeId}
```

#### Query Parameters

| Parameter |  Type  |             Description              | Required? | Default |
| :-------: | :----: | :----------------------------------: | :-------: | :-----: |
| `animeId` | string | The unique anime id (in kebab case). |    Yes    |   --    |

#### Request Sample

```javascript
const resp = await fetch("/api/v2/hianime/qtip/one-piece-100");
const data = await resp.json();
console.log(data);
```

#### Response Schema

```javascript
{
  success: true,
  data: {
    anime: {
      id: "one-piece-100",
      name: "One Piece",
      malscore: string,
      quality: string,
      episodes: {
        sub: number,
        dub: number
      },
      type: string,
      description: string,
      jname: string,
      synonyms: string,
      aired: string,
      status: string,
      genres: ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Shounen"]
    }
  }
}
```

[🔼 Back to Top](#table-of-contents)

### `GET` Anime About Info

#### Endpoint

```sh
/api/v2/hianime/anime/{animeId}
```

#### Query Parameters

| Parameter |  Type  |             Description              | Required? | Default |
| :-------: | :----: | :----------------------------------: | :-------: | :-----: |
| `animeId` | string | The unique anime id (in kebab case). |    Yes    |   --    |

#### Request Sample

```javascript
const resp = await fetch("/api/v2/hianime/anime/attack-on-titan-112");
const data = await resp.json();
console.log(data);
```

#### Response Schema

```javascript
{
  success: true,
  data: {
    anime: {
      id: string,
      name: string,
      poster: string,
      description: string,
      type: string,
      status: string,
      rating: string,
      quality: string,
      episodes: {
        sub: number,
        dub: number
      },
      duration: string,
      premiered: string,
      aired: string,
      score: string,
      studios: ["Wit Studio", ...],
      producers: ["Production I.G", ...],
      genres: ["Action", "Mystery", ...],
      synonyms: string,
      japanese: string,
    },
    related: [
      {
        id: string,
        name: string,
        poster: string,
        duration: string,
        type: string,
        rating: string,
        episodes: {
          sub: number,
          dub: number,
        }
      },
      {...},
    ]
  }
}
```

[🔼 Back to Top](#table-of-contents)

### `GET` Search Results

#### Endpoint

```sh
# basic example
/api/v2/hianime/search?q={query}&page={page}

# advanced example
/api/v2/hianime/search?q={query}&page={page}&genres={genres}&type={type}&sort={sort}&season={season}&language={sub_or_dub}&status={status}&rated={rating}&start_date={yyyy-mm-dd}&end_date={yyyy-mm-dd}&score={score}
```

#### Query Parameters

|  Parameter   |  Type  |                            Description                            | Required? | Default |
| :----------: | :----: | :---------------------------------------------------------------: | :-------: | :-----: |
|     `q`      | string | The search query, i.e. the title of the item you are looking for. |    Yes    |   --    |
|    `page`    | number |                  The page number of the result.                   |    No     |   `1`   |
|    `type`    | string |                  Type of the anime. eg: `movie`                   |    No     |   --    |
|   `status`   | string |            Status of the anime. eg: `finished-airing`             |    No     |   --    |
|   `rated`    | string |             Rating of the anime. eg: `r+` or `pg-13`              |    No     |   --    |
|   `score`    | string |           Score of the anime. eg: `good` or `very-good`           |    No     |   --    |
|   `season`   | string |              Season of the aired anime. eg: `spring`              |    No     |   --    |
|  `language`  | string |     Language category of the anime. eg: `sub` or `sub-&-dub`      |    No     |   --    |
| `start_date` | string |       Start date of the anime(yyyy-mm-dd). eg: `2014-10-2`        |    No     |   --    |
|  `end_date`  | string |        End date of the anime(yyyy-mm-dd). eg: `2010-12-4`         |    No     |   --    |
|    `sort`    | string |      Order of sorting the anime result. eg: `recently-added`      |    No     |   --    |
|   `genres`   | string |   Genre of the anime, separated by commas. eg: `isekai,shounen`   |    No     |   --    |

> [!TIP]
> For both `start_date` and `end_date`, year must be mentioned. If you wanna omit date or month specify `0` instead.
> Eg: omitting date -> 2014-10-0, omitting month -> 2014-0-12, omitting both -> 2014-0-0

#### Request Sample

```javascript
// basic example
const resp = await fetch("/api/v2/hianime/search?q=titan&page=1");
const data = await resp.json();
console.log(data);

// advanced example
const resp = await fetch(
    "/api/v2/hianime/search?q=girls&genres=action,adventure&type=movie&sort=score&season=spring&language=dub&status=finished-airing&rated=pg-13&start_date=2014-0-0&score=good"
);
const data = await resp.json();
console.log(data);
```

#### Response Schema

```javascript
{
  success: true,
  data: {
    animes: [
      {
        id: string,
        name: string,
        poster: string,
        duration: string,
        type: string,
        rating: string,
        episodes: {
          sub: number,
          dub: number,
        }
      },
      {...},
    ],
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    searchQuery: string,
    searchFilters: {
      [filter_name]: [filter_value]
      ...
    }
  }
}
```

[🔼 Back to Top](#table-of-contents)

### `GET` Search Suggestions

#### Endpoint

```sh
/api/v2/hianime/search/suggestion?q={query}
```

#### Query Parameters

| Parameter |  Type  |         Description          | Required? | Default |
| :-------: | :----: | :--------------------------: | :-------: | :-----: |
|    `q`    | string | The search suggestion query. |    Yes    |   --    |

#### Request Sample

```javascript
const resp = await fetch("/api/v2/hianime/search/suggestion?q=monster");
const data = await resp.json();
console.log(data);
```

#### Response Schema

```javascript
{
  success: true,
  data: {
    suggestions: [
      {
        id: string,
        name: string,
        poster: string,
        jname: string,
        moreInfo: ["Jan 21, 2022", "Movie", "17m"]
      },
      {...},
    ]
  }
}
```

[🔼 Back to Top](#table-of-contents)

### `GET` Producer Animes

#### Endpoint

```sh
/api/v2/hianime/producer/{name}?page={page}
```

#### Path Parameters

| Parameter |  Type  |                 Description                 | Required? | Default |
| :-------: | :----: | :-----------------------------------------: | :-------: | :-----: |
|  `name`   | string | The name of anime producer (in kebab case). |    Yes    |   --    |

#### Query Parameters

| Parameter |  Type  |          Description           | Required? | Default |
| :-------: | :----: | :----------------------------: | :-------: | :-----: |
|  `page`   | number | The page number of the result. |    No     |   `1`   |

#### Request Sample

```javascript
const resp = await fetch("/api/v2/hianime/producer/toei-animation?page=2");
const data = await resp.json();
console.log(data);
```

#### Response Schema

```javascript
{
  success: true,
  data: {
    producerName: "Toei Animation Anime",
    animes: [
      {
        id: string,
        name: string,
        poster: string,
        duration: string,
        type: string,
        rating: string,
        episodes: {
          sub: number,
          dub: number,
        }
      },
      {...},
    ],
    currentPage: 2,
    totalPages: 11,
    hasNextPage: true
  }
}
```

[🔼 Back to Top](#table-of-contents)

### `GET` Genre Animes

#### Endpoint

```sh
/api/v2/hianime/genre/{name}?page={page}
```

#### Path Parameters

| Parameter |  Type  |               Description                | Required? | Default |
| :-------: | :----: | :--------------------------------------: | :-------: | :-----: |
|  `name`   | string | The name of anime genre (in kebab case). |    Yes    |   --    |

#### Query Parameters

| Parameter |  Type  |          Description           | Required? | Default |
| :-------: | :----: | :----------------------------: | :-------: | :-----: |
|  `page`   | number | The page number of the result. |    No     |   `1`   |

#### Request Sample

```javascript
const resp = await fetch("/api/v2/hianime/genre/shounen?page=2");
const data = await resp.json();
console.log(data);
```

#### Response Schema

```javascript
{
  success: true,
  data: {
    genreName: "Shounen Anime",
    animes: [
      {
        id: string,
        name: string,
        poster: string,
        duration: string,
        type: string,
        rating: string,
        episodes: {
          sub: number,
          dub: number,
        }
      },
      {...},
    ],
    genres: ["Action", "Cars", "Adventure", ...],
    currentPage: 2,
    totalPages: 38,
    hasNextPage: true
  }
}
```

[🔼 Back to Top](#table-of-contents)

### `GET` Category Animes

#### Endpoint

```sh
/api/v2/hianime/category/{name}?page={page}
```

#### Path Parameters

| Parameter  |  Type  |      Description       | Required? | Default |
| :--------: | :----: | :--------------------: | :-------: | :-----: |
| `category` | string | The category of anime. |    Yes    |   --    |

#### Query Parameters

| Parameter |  Type  |          Description           | Required? | Default |
| :-------: | :----: | :----------------------------: | :-------: | :-----: |
|  `page`   | number | The page number of the result. |    No     |   `1`   |

#### Request Sample

```javascript
// categories -> "most-favorite", "most-popular", "subbed-anime", "dubbed-anime", "recently-updated", "recently-added", "top-upcoming", "top-airing", "movie", "special", "ova", "ona", "tv", "completed"

const resp = await fetch("/api/v2/hianime/category/tv?page=2");
const data = await resp.json();
console.log(data);
```

#### Response Schema

```javascript
{
  success: true,
  data: {
    category: "TV Series Anime",
    animes: [
      {
        id: string,
        name: string,
        poster: string,
        duration: string,
        type: string,
        rating: string,
        episodes: {
          sub: number,
          dub: number,
        }
      },
      {...},
    ],
    genres: ["Action", "Cars", "Adventure", ...],
    currentPage: 2,
    totalPages: 100,
    hasNextPage: true
  }
}
```

[🔼 Back to Top](#table-of-contents)

### `GET` Estimated Schedules

#### Endpoint

```sh
/api/v2/hianime/schedule?date={date}
```

#### Query Parameters

| Parameter |  Type  |                               Description                               | Required? | Default |
| :-------: | :----: | :---------------------------------------------------------------------: | :-------: | :-----: |
|  `date`   | string | The date of the desired schedule in the following format: (yyyy-mm-dd). |    Yes    |   --    |

#### Request Sample

```javascript
const resp = await fetch("/api/v2/hianime/schedule?date=2024-06-09");
const data = await resp.json();
console.log(data);
```

#### Response Schema

```javascript
{
  success: true,
  data: {
    scheduledAnimes: [
      {
        id: string,
        time: string, // 24 hours format
        name: string,
        jname: string,
        airingTimestamp: number,
        secondsUntilAiring: number
      },
      {...}
    ]
  }
}
```

[🔼 Back to Top](#table-of-contents)

### `GET` Anime Episodes

#### Endpoint

```sh
/api/v2/hianime/anime/{animeId}/episodes
```

#### Path Parameters

| Parameter |  Type  |     Description      | Required? | Default |
| :-------: | :----: | :------------------: | :-------: | :-----: |
| `animeId` | string | The unique anime id. |    Yes    |   --    |

#### Request Sample

```javascript
const resp = await fetch("/api/v2/hianime/anime/steinsgate-3/episodes");
const data = await resp.json();
console.log(data);
```

#### Response Schema

```javascript
{
  success: true,
  data: {
    totalEpisodes: 24,
    episodes: [
      {
        number: 1,
        title: "Turning Point",
        episodeId: "steinsgate-3?ep=213",
        isFiller: false,
      },
      {...}
    ]
  }
}
```

[🔼 Back to Top](#table-of-contents)

### `GET` Anime Episode Servers

#### Endpoint

```sh
/api/v2/hianime/episode/servers?animeEpisodeId={id}
```

#### Query Parameters

|    Parameter     |  Type  |         Description          | Required? | Default |
| :--------------: | :----: | :--------------------------: | :-------: | :-----: |
| `animeEpisodeId` | string | The unique anime episode id. |    Yes    |   --    |

#### Request Sample

```javascript
const resp = await fetch(
    "/api/v2/hianime/episode/servers?animeEpisodeId=steinsgate-0-92?ep=2055"
);
const data = await resp.json();
console.log(data);
```

#### Response Schema

```javascript
{
  success: true,
  data: {
    episodeId: "steinsgate-0-92?ep=2055",
    episodeNo: 5,
    sub: [
      {
        serverId: 4,
        serverName: "vidstreaming",
      },
      {...}
    ],
    dub: [
      {
        serverId: 1,
        serverName: "megacloud",
      },
      {...}
    ],
    raw: [
      {
        serverId: 1,
        serverName: "megacloud",
      },
      {...}
    ]
  }
}
```

[🔼 Back to Top](#table-of-contents)

### `GET` Anime Episode Streaming Links

#### Endpoint

```sh
/api/v2/hianime/episode/sources?animeEpisodeId={id}&server={server}&category={dub || sub || raw}
```

#### Query Parameters

|    Parameter     |  Type  |                     Description                      | Required? | Default  |
| :--------------: | :----: | :--------------------------------------------------: | :-------: | :------: |
| `animeEpisodeId` | string |             The unique anime episode id.             |    Yes    |    --    |
|     `server`     | string |               The name of the server.                |    No     | `"hd-1"` |
|    `category`    | string | The category of the episode ('sub', 'dub' or 'raw'). |    No     | `"sub"`  |

#### Request Sample

```javascript
const resp = await fetch(
    "/api/v2/hianime/episode/sources?animeEpisodeId=steinsgate-3?ep=230&server=hd-1&category=dub"
);
const data = await resp.json();
console.log(data);
```

#### Response Schema

```javascript
{
  success: true,
  data: {
    headers: {
      Referer: string,
      "User-Agent": string,
      ...
    },
    sources: [
      {
        url: string, // .m3u8 hls streaming file
        isM3U8: boolean,
        quality?: string,
      },
      {...}
    ],
    subtitles: [
      {
        lang: "English",
        url: string, // .vtt subtitle file
      },
      {...}
    ],
    anilistID: number | null,
    malID: number | null
  }
}
```

[🔼 Back to Top](#table-of-contents)

## <span id="development">👨‍💻 Development</span>

Pull requests and stars are always welcome. If you encounter any bug or want to add a new feature to this api, consider creating a new [issue](https://github.com/senpaiorbit/hanime-api-rebuild-/issues). If you wish to contribute to this project, read the [CONTRIBUTING.md](https://github.com/senpaiorbit/hanime-api-rebuild-/blob/main/CONTRIBUTING.md) file.

## <span id="contributors">✨ Contributors</span>

Thanks to the following people for keeping this project alive and relevant.

[![](https://contrib.rocks/image?repo=senpaiorbit/hanime-api-rebuild-)](https://github.com/senpaiorbit/hanime-api-rebuild-/graphs/contributors)

## <span id="thanks">🤝 Thanks</span>

- [consumet.ts](https://github.com/consumet/consumet.ts)
- [api.consumet.org](https://github.com/consumet/api.consumet.org)
- [@itzzzme](https://github.com/itzzzme)
- [@Ciarands](https://github.com/Ciarands)

## <span id="support">🙌 Support</span>

Don't forget to leave a star 🌟.

## <span id="license">📜 License</span>

This project is licensed under the [MIT License](https://opensource.org/license/mit/) - see the [LICENSE](https://github.com/senpaiorbit/hanime-api-rebuild-/blob/main/LICENSE) file for more details.
