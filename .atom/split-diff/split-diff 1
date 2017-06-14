# %%
%matplotlib inline
%reload_ext autoreload
%autoreload 2

%aimport numpy

from scipy.stats import beta

from examples import stats_plots
from examples import bernoulli_trials

# The beta distribution is the continuos version of the binomial distribition where factorials are replaced by Γ(n)
# and the exponents for polynomials are not required to be integers. It is also only defined for 0 <= p <= 1 Where
# p the equivalent of the probability in the binomial distribution.
#   Β(α,β) = Γ(α)Γ(β)/Γ(α+β)
#   Beta(p,α,β) = p^(α-1)(1-p)^(β-1)/Β(α,β)
# is related to
#   Binomial(p, n, m) = [(p^m)(1-p)^(n-m)]n!/(n-m)!m!

# %%
# The beta distribution is the conjugate prior of the binomial distribution for
# estimating the succes probability of a trial. The posterior distribution is given by

def beta_posterior(success_count, n, x, α, β):
    return beta.pdf(x, α + success_count, β + n - success_count)

def beta_μ(α, β):
    return α/(α + β)

def beta_σ(α, β):
    return numpy.sqrt(α * β/((α + β + 1)*(α + β)**2))

def beta_mode(α, β):
    return (α - 1.0) / (α + β - 2)

# %%
# cdf is the cumlative distribution function
# For standard beta distribution the cdf approaches 1 as x ⇢ 1
beta.cdf(1.0, 0.5, 1.75)
beta.cdf(1.0, 2.25, 1.8)
beta.cdf(1.0, 2.75, 3.83)

# For the standard beta distribution the cdf approaches 0 as x ⇢ 0
beta.cdf(0.0, 1.5, 1.75)
beta.cdf(0.0, 2.25, 1.8)
beta.cdf(0.0, 2.75, 3.83)

# %%
# ppf is percentile point function which returns the value of the distribution at the specified percentile the
# inverse of the cdf. No close for expression exists for the median of the Beta distribution so it must be evaluated
# numerically using the percentile point function.
beta.ppf(0.5, 0.5, 1.75)
beta.ppf(0.5, 1.0, 1.0)

# %%
beta_μ(3.0, 5.0)
beta.mean(3.0, 5.0)

beta_σ(3.0, 5.0)
beta.std(3.0, 5.0)

# %%
# The Beta distribution is unform for α = β = 1.
x = numpy.linspace(0.0, 1.0, 100)
stats_plots.pdf_plot(x, beta.pdf(x, 1.0, 1.0))

# %%
# For α > 1 and β > 1 the Beta distribution has a maximum mode for 0 < x < 1
beta_mode(2.0, 4.0)
beta_mode(4.0, 4.0)
beta_mode(8.0, 4.0)
x = numpy.linspace(0.0, 1.0, 100)
beta_pdfs = [beta.pdf(x, 2.0, 4.0), beta.pdf(x, 4.0, 4.0), beta.pdf(x, 8.0, 4.0)]
stats_plots.multi_line_pdf_plot(x, beta_pdfs)

# %%
# For α >> 1 and β >> 1 σ^2 → 0. The distribution becomes sharpley peaked.
x = numpy.linspace(0.0, 1.0, 100)
beta_pdfs = [beta.pdf(x, 2.0, 4.0), beta.pdf(x, 40.0, 80.0), beta.pdf(x, 400.0, 800.0)]
stats_plots.multi_line_pdf_plot(x, beta_pdfs)

# %%
# For  α ≫ β and β > 1 the mode approaches 1 and σ^2 → 0. The distribution becomes sharpley peaked.
beta_mode(5.0, 1.5),
beta_mode(20.0, 1.5)
beta_mode(50.0, 1.5)
x = numpy.linspace(0.0, 1.0, 1000)
beta_pdfs = [beta.pdf(x, 5.0, 1.5), beta.pdf(x, 20.0, 1.5), beta.pdf(x, 50.0, 1.5)]
stats_plots.multi_line_pdf_plot(x, beta_pdfs)

# %%
# For  β ≫ α and α > 1 the mode approaches 0 and σ^2 → 0. The distribution becomes sharpley peaked.
beta_mode(1.5, 5.0)
beta_mode(1.5, 20.0)
beta_mode(1.5, 50.0)
x = numpy.linspace(0.0, 1.0, 1000)
beta_pdfs = [beta.pdf(x, 1.5, 5.0), beta.pdf(x, 1.5, 20.0), beta.pdf(x, 1.5, 50.0)]
stats_plots.multi_line_pdf_plot(x, beta_pdfs)

# %%
# For  α = β and α, β > 1 the distribution is symetric about the mode of 0,5 and becomes sharper as α increases.
beta_mode(5.0, 5.0)
beta_mode(20.0, 20.0)
beta_mode(50.0, 50.0)
beta_μ(5.0, 5.0)
beta_μ(20.0, 20.0)
beta_μ(50.0, 50.0)
beta_σ(5.0, 5.0)
beta_σ(20.0, 20.0)
beta_σ(50.0, 50.0)
x = numpy.linspace(0.0, 1.0, 1000)
beta_pdfs = [beta.pdf(x, 5.0, 5.0), beta.pdf(x, 20.0, 20.0), beta.pdf(x, 50.0, 50.0)]
stats_plots.multi_line_pdf_plot(x, beta_pdfs)

# %%
# For  1 < α < 2 and 0 < β < 2 - α no exterma exists for 0 < x < 1. The distribution has a singularity at x = 1.0.
x = numpy.linspace(0.0, 1.0, 1000)
beta_pdfs = [beta.pdf(x, 1.05, 0.75), beta.pdf(x, 1.05, 0.85), beta.pdf(x, 1.05, 0.9)]
stats_plots.multi_line_pdf_plot(x, beta_pdfs)

# %%
# For  α < 1 and 1 < β < 2 - α no exterma exists for 0 < x < 1. The distribution has a singularity at x = 0.0.
x = numpy.linspace(0.0, 1.0, 1000)
beta_pdfs = [beta.pdf(x, 0.9, 1.025), beta.pdf(x, 0.9, 1.05), beta.pdf(x, 0.9, 1.075)]
stats_plots.multi_line_pdf_plot(x, beta_pdfs)

# %%
# For  α < 1 and β > 2 no exterma exists for 0 < x < 1. The distribution has a singularity at x = 0.0.
x = numpy.linspace(0.0, 1.0, 1000)
beta_pdfs = [beta.pdf(x, 0.9, 3.0), beta.pdf(x, 0.9, 4.0), beta.pdf(x, 0.9, 5.0)]
stats_plots.multi_line_pdf_plot(x, beta_pdfs)

# %%
# For  α > 1 and β < 1 no exterma exists for 0 < x < 1. The distribution has a singularity at x = 1.0.
x = numpy.linspace(0.0, 1.0, 1000)
beta_pdfs = [beta.pdf(x, 5.0, 0.95), beta.pdf(x, 10.0, 0.95), beta.pdf(x, 20.0, 0.95)]
stats_plots.multi_line_pdf_plot(x, beta_pdfs)

# %%
# For  α < 1 and β < 1 the mode is a minimm or antimode. The distribution has a singularities at x = 1.0 and x = 0.0.
beta_mode(0.95, 0.8)
beta_mode(0.95, 0.85)
beta_mode(0.95, 0.9)
x = numpy.linspace(0.0, 1.0, 1000)
beta_pdfs = [beta.pdf(x, 0.95, 0.8), beta.pdf(x, 0.95, 0.85), beta.pdf(x, 0.95, 0.9)]
stats_plots.multi_line_pdf_plot(x, beta_pdfs)


# %%
# For  α >> β and β < 1 no exterma exists for 0 < x < 1. The distribution has a singularity at x = 1.0.
x = numpy.linspace(0.0, 1.0, 1000)
beta_pdfs = [beta.pdf(x, 5.0, 0.95), beta.pdf(x, 20.0, 0.95), beta.pdf(x, 50.0, 0.95)]
stats_plots.multi_line_pdf_plot(x, beta_pdfs)

# %%
# For  α = β and α, β < 1 the mode is a minimum or animode with value 0.5. The distribution is symetric about the  mode
# and has a singularities at x = 1.0 and x = 0.0. σ → 0.5 as α → 0.
beta_mode(0.85, 0.85)
beta_mode(0.9, 0.9)
beta_mode(0.95, 0.95)
beta_μ(0.85, 0.85)
beta_μ(0.9, 0.9)
beta_μ(0.95, 0.95)
beta_σ(0.9, 0.9)
beta_σ(0.05, 0.05)
beta_σ(0.01, 0.01)
x = numpy.linspace(0.0, 1.0, 1000)
beta_pdfs = [beta.pdf(x, 0.85, 0.85), beta.pdf(x, 0.9, 0.9), beta.pdf(x, 0.95, 0.95)]
stats_plots.multi_line_pdf_plot(x, beta_pdfs)

# %%
# Example CDFs
x = numpy.linspace(0.0, 1.0, 100)
beta_cdfs = [beta.cdf(x, 0.5, 0.5), beta.cdf(x, 1.0, 1.0), beta.cdf(x, 2.0, 2.0), beta.cdf(x, 8.0, 8.0),
             beta.cdf(x, 10.0, 10.0)]
stats_plots.multi_line_pdf_plot(x, beta_cdfs)

## %%
# estimate probability for fair Bernouli trail using beta posterior with unform
# prior, α=1.0, β=1.0
p = 0.5
ns = [10, 100, 1000, 10000]
x = numpy.linspace(0.0, 1.0, 100)
success_counts = [bernoulli_trials.success_count_trial(p, n) for n in ns]
posterior_distributions = [beta_posterior(success_counts[i], ns[i], x, 1.0, 1.0) for i in range(len(ns))]
stats_plots.multi_line_pdf_plot(x, posterior_distributions)

## %%
# estimate probability for failing Bernouli trail using beta posterior with unform
# prior, α=1.0, β=1.0
p = 0.35
ns = [10, 100, 1000, 10000]
x = numpy.linspace(0.0, 1.0, 100)
success_counts = [bernoulli_trials.success_count_trial(p, n) for n in ns]
posterior_distributions = [beta_posterior(success_counts[i], ns[i], x, 1.0, 1.0) for i in range(len(ns))]
stats_plots.multi_line_pdf_plot(x, posterior_distributions)
