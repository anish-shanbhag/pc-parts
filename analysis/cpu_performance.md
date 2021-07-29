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
    ## 1 AArch64 rev 0 (aarch64)        2.5     8       8                  1589
    ## 2 AArch64 rev 1 (aarch64)     2362.0     8       8                  1666
    ## 3 AArch64 rev 2 (aarch64)        2.2     8       8                  1862
    ## 4 AArch64 rev 4 (aarch64)     2112.0     8       8                  2042
    ## 5             AC8257V/WAB     2001.0     8       8                  2805
    ## 6              AMD 3015Ce        1.2     2       4                  2164
    ##   cpu_mark_rating cpu_mark_single_thread_rating cpu_mark_cross_platform_rating
    ## 1            2499                          1048                           6694
    ## 2            2316                          1037                           6817
    ## 3            1956                           925                           5495
    ## 4            1658                           642                           3943
    ## 5             693                           495                           1693
    ## 6            1474                          1391                           4192
    ##   cpu_mark_samples test_suite_integer_math test_suite_floating_point_math
    ## 1               25                   25705                           6224
    ## 2               45                   24516                           6025
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
    ## 2                      493.3                        52.0                233
    ## 3                      430.0                        42.7                184
    ## 4                      473.1                        35.3                 92
    ## 5                      205.5                        13.2                 53
    ## 6                      267.0                        32.0                151
    ##   test_suite_extended_instructions test_suite_single_thread  class socket
    ## 1                             1018                     1048   <NA>   <NA>
    ## 2                              832                     1037   <NA>   <NA>
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

The `cpu_mark_rating` and `cpu_mark_single_thread_rating` columns refer
to the overall and single thread scores, respectively, determined by the
PassMark benchmark software for each CPU. The `release_quarter` column
refers to an integer computed by taking the difference between the year
of release and 2007, multiplying by four, and adding the year’s quarter
as an indication of time.

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
    ## 3               8            3288                          1452
    ## 4               9            3386                          1503
    ## 5              10            3354                          1571
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

There does seem to be a positive association, though it is unclear if it
is linear or nonlinear.

## Regression Analysis

To create an exponential model for overall performance, I perform a
least-squares regression with the natural logarithm of `cpu_mark_rating`
and `release_quarter`.

``` r
p1_model <- lm(log(cpu_mark_rating) ~ release_quarter, data = result)
```

Next, I calculate the 95% prediction intervals for the model.

``` r
p1_pred_int <- predict(p1_model, interval = "prediction", level = 0.95)
```

    ## Warning in predict.lm(p1_model, interval = "prediction", level = 0.95): predictions on current data refer to _future_ responses

``` r
reg1 <- data.frame(cbind(result$release_quarter, result$cpu_mark_rating, exp(p1_pred_int)))
reg1 <- reg1 %>%
  rename(
    release_quarter = V1,
    cpu_mark_rating = V2
  )
```

Plotting the regression model and the prediction interval yields:

``` r
ggplot(reg1, aes(x = release_quarter, y = cpu_mark_rating)) + geom_point(color = "blue") + geom_line(aes(y = lwr), color = "black", linetype = "dashed") + geom_line(aes(y = upr), color = "black", linetype = "dashed") + geom_line(aes(y = fit), color = "orange")
```

![](cpu_performance_files/figure-gfm/unnamed-chunk-9-1.png)<!-- -->

This process will be repeated for single thread performance, except with
the use of a simple linear regression.

``` r
p2_model <- lm(cpu_mark_single_thread_rating ~ release_quarter, data = result)
p2_pred_int <- predict(p2_model, interval = "prediction", level = 0.95)
```

    ## Warning in predict.lm(p2_model, interval = "prediction", level = 0.95): predictions on current data refer to _future_ responses

``` r
reg2 <- data.frame(cbind(result$release_quarter, result$cpu_mark_single_thread_rating, p2_pred_int))
reg2 <- reg2 %>%
  rename(
    release_quarter = V1,
    cpu_mark_single_thread_rating = V2
  )

ggplot(reg2, aes(x = release_quarter, y = cpu_mark_single_thread_rating)) + geom_point(color = "red") + geom_line(aes(y = lwr), color = "black", linetype = "dashed") + geom_line(aes(y = upr), color = "black", linetype = "dashed") + geom_line(aes(y = fit), color = "green")
```

![](cpu_performance_files/figure-gfm/unnamed-chunk-10-1.png)<!-- -->

``` r
summary(p2_model)
```

    ## 
    ## Call:
    ## lm(formula = cpu_mark_single_thread_rating ~ release_quarter, 
    ##     data = result)
    ## 
    ## Residuals:
    ##     Min      1Q  Median      3Q     Max 
    ## -416.13  -90.89   25.63  101.61  457.23 
    ## 
    ## Coefficients:
    ##                 Estimate Std. Error t value Pr(>|t|)    
    ## (Intercept)     1113.593     62.315   17.87   <2e-16 ***
    ## release_quarter   38.582      1.762   21.89   <2e-16 ***
    ## ---
    ## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
    ## 
    ## Residual standard error: 180.4 on 39 degrees of freedom
    ## Multiple R-squared:  0.9247, Adjusted R-squared:  0.9228 
    ## F-statistic: 479.3 on 1 and 39 DF,  p-value: < 2.2e-16

## Extrapolation and Rationale

``` r
exp(predict(p1_model, newdata = data.frame(release_quarter = 76), interval = "prediction", level = 0.95))
```

    ##        fit      lwr      upr
    ## 1 251899.3 149443.2 424597.9
