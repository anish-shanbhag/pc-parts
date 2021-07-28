CPU Performance Analysis
================

## Set-Up

First, the necessary packages are loaded in.

``` r
pacman::p_load(pacman, rio, dplyr, ggplot2)
```

Next, we import our data into a dataframe.

``` r
df <- import("../data/cpu_cleaned.json")
```

    ## Loading required namespace: jsonlite

``` r
head(df)
```

    ##                      name base_clock cores threads cpu_mark_overall_rank
    ## 1 AArch64 rev 0 (aarch64)        2.5     8       8                  1588
    ## 2 AArch64 rev 1 (aarch64)     2362.0     8       8                  1665
    ## 3 AArch64 rev 2 (aarch64)        2.2     8       8                  1861
    ## 4 AArch64 rev 4 (aarch64)     2112.0     8       8                  2041
    ## 5             AC8257V/WAB     2001.0     8       8                  2804
    ## 6              AMD 3015Ce        1.2     2       4                  2163
    ##   cpu_mark_rating cpu_mark_single_thread_rating cpu_mark_cross_platform_rating
    ## 1            2499                          1048                           6694
    ## 2            2315                          1036                           6804
    ## 3            1956                           925                           5495
    ## 4            1658                           642                           3943
    ## 5             693                           495                           1693
    ## 6            1474                          1391                           4192
    ##   cpu_mark_samples test_suite_integer_math test_suite_floating_point_math
    ## 1               25                   25705                           6224
    ## 2               44                   24516                           6020
    ## 3               24                   22846                           5814
    ## 4               43                   24632                           3724
    ## 5                1                    8844                           1282
    ## 6                1                   10231                           4968
    ##   test_suite_find_prime_numbers test_suite_random_string_sorting
    ## 1                            10                                8
    ## 2                            10                                8
    ## 3                             7                                8
    ## 4                             5                                6
    ## 5                             2                                3
    ## 6                             8                                3
    ##   test_suite_data_encryption test_suite_data_compression test_suite_physics
    ## 1                      553.6                        53.0                214
    ## 2                      492.7                        51.9                233
    ## 3                      430.0                        42.7                184
    ## 4                      473.1                        35.3                 92
    ## 5                      205.5                        13.2                 53
    ## 6                      267.0                        32.0                151
    ##   test_suite_extended_instructions test_suite_single_thread  class socket
    ## 1                             1018                     1048   <NA>   <NA>
    ## 2                              832                     1036   <NA>   <NA>
    ## 3                              766                      925   <NA>   <NA>
    ## 4                              548                      642   <NA>   <NA>
    ## 5                              211                      495   <NA>   <NA>
    ## 6                              737                     1391 Mobile    FT5
    ##   turbo_clock tdp release_quarter old_cpu_mark_rating
    ## 1          NA  NA              NA                  NA
    ## 2          NA  NA              NA                  NA
    ## 3          NA  NA              NA                  NA
    ## 4          NA  NA              NA                  NA
    ## 5          NA  NA              NA                  NA
    ## 6         2.3   6              NA                  NA
    ##   old_cpu_mark_single_thread_rating
    ## 1                                NA
    ## 2                                NA
    ## 3                                NA
    ## 4                                NA
    ## 5                                NA
    ## 6                                NA

## Data Preparation

It’s clear that there is a lot of data, much of it being extraneous.
Since I want to analyze CPU performance over time, I need to isolate the
relevant columns and remove any rows with NaN entries in those columns.

``` r
df <- df[, c("name", "cpu_mark_rating", "cpu_mark_single_thread_rating", "release_quarter")]
cpu_perf <- na.omit(df)

# CHEAP FIX, REMOVE IN FINAL
cpu_perf$cpu_mark_single_thread_rating[cpu_perf$cpu_mark_single_thread_rating > 4000] <- cpu_perf$cpu_mark_single_thread_rating %/% 10
```

    ## Warning in
    ## cpu_perf$cpu_mark_single_thread_rating[cpu_perf$cpu_mark_single_thread_rating
    ## > : number of items to replace is not a multiple of replacement length

``` r
# PART 2 LMAO
cpu_perf$cpu_mark_single_thread_rating[cpu_perf$release_quarter < 30 & cpu_perf$cpu_mark_single_thread_rating > 2500] <- cpu_perf$cpu_mark_single_thread_rating %/% 10
```

    ## Warning in cpu_perf$cpu_mark_single_thread_rating[cpu_perf$release_quarter < :
    ## number of items to replace is not a multiple of replacement length

``` r
head(cpu_perf)
```

    ##                       name cpu_mark_rating cpu_mark_single_thread_rating
    ## 7                AMD 3015e            2678                          1408
    ## 8                AMD 3020e            2611                          1472
    ## 9                AMD 4700S           18045                          2389
    ## 10 AMD A10 Micro-6700T APU            1291                           703
    ## 11   AMD A10 PRO-7350B APU            1910                           911
    ## 12   AMD A10 PRO-7800B APU            3194                          1497
    ##    release_quarter
    ## 7               54
    ## 8               54
    ## 9               58
    ## 10              34
    ## 11              30
    ## 12              32

The *cpu\_mark\_rating* and *cpu\_mark\_single\_thread\_rating* columns
refer to the overall and single thread scores, respectively, determined
by the PassMark benchmark software for each CPU. The *release\_quarter*
column refers to an integer computed by taking the difference between
the year of release and 2007, multiplying by four, and adding the year’s
quarter as an indication of time.

I want to examine how overall and single thread performance has changed
over time. One way of displaying these improvements is plotting maximum
scores for the CPUs in each release quarter. Plotting mean or median
scores wouldn’t make much sense since most CPUs are created for average
consumers.

In order to do this, I need to create a new dataframe that takes
`cpu_perf`, groups by release quarter, and finds both maximum scores.

``` r
result <- aggregate(cbind(cpu_mark_rating, cpu_mark_single_thread_rating) ~ release_quarter, data = cpu_perf, max)

head(result)
```

    ##   release_quarter cpu_mark_rating cpu_mark_single_thread_rating
    ## 1               1            1678                           827
    ## 2               5            2705                          1446
    ## 3               8            3288                          1522
    ## 4               9            3386                          2282
    ## 5              10            3354                          2232
    ## 6              12            3471                          1546

## Plotting

Let’s first look at overall performance.

``` r
ggplot(result, aes(x = release_quarter, y = cpu_mark_rating)) + geom_point(color = "blue")
```

![](cpu_performance_files/figure-gfm/unnamed-chunk-5-1.png)<!-- -->

There appears to be a strong, positive exponential relationship.

Next, let’s look at single thread performance.

``` r
ggplot(result, aes(x = release_quarter, y = cpu_mark_single_thread_rating)) + geom_point(color = "red")
```

![](cpu_performance_files/figure-gfm/unnamed-chunk-6-1.png)<!-- -->
