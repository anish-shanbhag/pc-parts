CPU Market Analysis
================

## Set-Up

Load the necessary libraries:

``` r
pacman::p_load(pacman, rio, dplyr, ggplot2, jsonlite)
```

Load the data:

``` r
df <- import("../data/cpu_passmark_market_share.json")
# head(df)
dim(df)
```

    ## [1] 2247   37

Upon inspecting the first several rows of the dataframe with `head(df)`,
which I excluded from the output to make this document less cluttered,
it looks like there are dataframes within `df`, specifically in the two
columns for market share data.

``` r
head(df$userbenchmark_market_share[1])
```

<div class="kable-table">

| Nov 20 |
|-------:|
|   0.00 |
|   0.02 |
|     NA |
|     NA |
|     NA |
|     NA |

</div>

It appears that `import()` incorrectly placed market share information
for every CPU by month in the columns instead of the other way around,
so I’ll need to manipulate the dataframe in some way to correctly
organize the data.

## Data Preparation

I’ll start by isolating the problematic columns along with the
corresponding CPU names so that later I can align the CPUs with their
market shares over time.

``` r
cleaned <- df[, c("name", "userbenchmark_market_share", "passmark_market_share")]
```

``` r
head(cleaned$userbenchmark_market_share)
```

<div class="kable-table">

| Nov 20 | Jun 20 | Jul 20 | Aug 20 | Sep 20 | Oct 20 | Dec 20 | Jan 21 | Feb 21 | Mar 21 | Apr 21 | May 21 | Jun 21 | Jul 21 | Dec 15 | Jan 16 | Feb 16 | Mar 16 | Apr 16 | May 16 | Jun 16 | Jul 16 | Aug 16 | Sep 16 | Oct 16 | Nov 16 | Dec 16 | Jan 17 | Feb 17 | Mar 17 | Apr 17 | May 17 | Jun 17 | Jul 17 | Aug 17 | Sep 17 | Oct 17 | Nov 17 | Dec 17 | Jan 18 | Feb 18 | Mar 18 | Apr 18 | May 18 | Jun 18 | Jul 18 | Jan 20 | Feb 20 | Mar 20 | Apr 20 | May 20 | Aug 18 | Sep 18 | Oct 18 | Nov 18 | Dec 18 | Jan 19 | Feb 19 | Mar 19 | Apr 19 | May 19 | Jun 19 | Jul 19 | Aug 19 | Sep 19 | Oct 19 | Nov 19 | Dec 19 | Mar 15 | Aug 15 | Sep 15 | Nov 15 |
|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|
|   0.00 |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |
|   0.02 |      0 |      0 |      0 |   0.01 |   0.01 |   0.01 |   0.01 |   0.02 |   0.01 |   0.02 |   0.02 |   0.02 |   0.01 |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |
|     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |   0.00 |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |
|     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |   0.00 |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |
|     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |
|     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |

</div>

Alright, so looks like my initial hypothesis was incorrect and I won’t
have to do too much manipulation. I think R was having trouble handling
JSON nesting and that there’s a limit to how much information it can
show at a time.

``` r
userbenchmark <- bind_cols(list(cleaned$name, cleaned$userbenchmark_market_share)) %>%
  rename(name = ...1) # workaround for weird naming issue
```

    ## New names:
    ## * NA -> ...1

``` r
head(userbenchmark)
```

<div class="kable-table">

| name                    | Nov 20 | Jun 20 | Jul 20 | Aug 20 | Sep 20 | Oct 20 | Dec 20 | Jan 21 | Feb 21 | Mar 21 | Apr 21 | May 21 | Jun 21 | Jul 21 | Dec 15 | Jan 16 | Feb 16 | Mar 16 | Apr 16 | May 16 | Jun 16 | Jul 16 | Aug 16 | Sep 16 | Oct 16 | Nov 16 | Dec 16 | Jan 17 | Feb 17 | Mar 17 | Apr 17 | May 17 | Jun 17 | Jul 17 | Aug 17 | Sep 17 | Oct 17 | Nov 17 | Dec 17 | Jan 18 | Feb 18 | Mar 18 | Apr 18 | May 18 | Jun 18 | Jul 18 | Jan 20 | Feb 20 | Mar 20 | Apr 20 | May 20 | Aug 18 | Sep 18 | Oct 18 | Nov 18 | Dec 18 | Jan 19 | Feb 19 | Mar 19 | Apr 19 | May 19 | Jun 19 | Jul 19 | Aug 19 | Sep 19 | Oct 19 | Nov 19 | Dec 19 | Mar 15 | Aug 15 | Sep 15 | Nov 15 |
|:------------------------|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|
| AMD 3015e               |   0.00 |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |
| AMD 3020e               |   0.02 |      0 |      0 |      0 |   0.01 |   0.01 |   0.01 |   0.01 |   0.02 |   0.01 |   0.02 |   0.02 |   0.02 |   0.01 |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |
| AMD 4700S               |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |   0.00 |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |
| AMD A10 Micro-6700T APU |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |   0.00 |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |
| AMD A10 PRO-7350B APU   |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |
| AMD A10 PRO-7800B APU   |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |     NA |

</div>

I’ll repeat this for data scraped from PassMark.

``` r
passmark <- bind_cols(list(cleaned$name, cleaned$passmark_market_share)) %>%
  rename(name = ...1)
```

    ## New names:
    ## * NA -> ...1

``` r
head(passmark)
```

<div class="kable-table">

| name                    | Jan 15 | Feb 15 | Mar 15 | Apr 15 | May 15 | Jun 15 | Jul 15 | Aug 15 | Sep 15 | Oct 15 | Nov 15 | Dec 15 | Jan 16 | Feb 16 | Mar 16 | Apr 16 | May 16 | Jun 16 | Jul 16 | Aug 16 | Sep 16 | Oct 16 | Nov 16 | Dec 16 | Jan 17 | Feb 17 | Mar 17 | Apr 17 | May 17 | Jun 17 | Jul 17 | Aug 17 | Sep 17 | Oct 17 | Nov 17 | Dec 17 | Jan 18 | Feb 18 | Mar 18 | Apr 18 | May 18 | Jun 18 | Jul 18 | Aug 18 | Sep 18 | Oct 18 | Nov 18 | Dec 18 | Jan 19 | Feb 19 | Mar 19 | Apr 19 | May 19 | Jun 19 | Jul 19 | Aug 19 | Sep 19 | Oct 19 | Nov 19 | Dec 19 | Jan 20 | Feb 20 | Mar 20 | Apr 20 | May 20 | Jun 20 | Jul 20 | Aug 20 | Sep 20 | Oct 20 | Nov 20 | Dec 20 | Jan 21 | Feb 21 | Mar 21 | Apr 21 | May 21 | Jun 21 | Jul 21 |
|:------------------------|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|:-------|-------:|-------:|-------:|-------:|-------:|-------:|:-------|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|:-------|-------:|-------:|-------:|-------:|-------:|:-------|-------:|:-------|-------:|:-------|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|-------:|
| AMD 3015e               |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 | NA     |      0 | NA     |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |
| AMD 3020e               |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 | NA     |      0 | NA     |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |
| AMD 4700S               |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 | NA     |      0 | NA     |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |
| AMD A10 Micro-6700T APU |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 | NA     |      0 | NA     |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |
| AMD A10 PRO-7350B APU   |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 | NA     |      0 | NA     |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |
| AMD A10 PRO-7800B APU   |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 | NA     |      0 |      0 |      0 |      0 |      0 | NA     |      0 | NA     |      0 | NA     |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |      0 |

</div>

Even though it seems like the nesting structure was preserved in the
original dataframe `df`, I still think it’s a good idea to flatten the
data like this for readability and simplicity. This will also make it
easier to compare the two market share data sets I just created and fill
in missing data when appropriate. For plotting purposes though, I’ll
probably need to reshape the combined dataframe.

However, before I just combine `userbenchmark` and `passmark`, I need to
establish several criteria for comparing the two dataframes: \*
