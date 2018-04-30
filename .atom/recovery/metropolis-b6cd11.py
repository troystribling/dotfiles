# %%

import numpy
from matplotlib import pyplot
from scipy import stats

%matplotlib inline

# %%

def gauss(x):
    return numpy.exp(-0.5*x**2)/numpy.sqrt(2.0*numpy.pi)

def cauchy(x):
    return 1.0/(numpy.pi*(1.0+x**2))

def weibull(x):
    return 0.544*x*numpy.exp(-(x/1.9)**2)

def metropolis(p, nsample=10000, x0=0.0):
    x = x0
    i = 0
    samples = numpy.zeros(nsample)

    while i < nsample:
        x_star = x + numpy.random.normal()
        reject = numpy.random.rand()
        px_star = p(x_star)
        px = p(x)
        if reject < px_star / px:
            x = x_star
        samples[i] = x
        i += 1

    return samples


def sample_plot(samples, sampled_function):
    figure, axis = pyplot.subplots(figsize=(12, 5))
    axis.set_xlabel("Sample", fontsize=15)
    axis.tick_params(labelsize=13)
    axis.set_ylabel("Value", fontsize=15)
    axis.set_title("Metropolis Sampling")
    axis.grid(True, zorder=5)
    _, bins, _ = axis.hist(samples, 50, density=True, color="#348ABD", alpha=0.6, label=f"Sampled Distribution", edgecolor="#348ABD", lw="3", zorder=10)
    sample_values = [sampled_function(val) for val in bins]
    axis.plot(bins, sample_values, color="#A60628", label=f"Sampled Function", lw="3", zorder=10)
    axis.legend()

# %%

samples = metropolis(gauss, nsample=10000)
sample_plot(samples, gauss)



# %%

samples = metropolis(cauchy, nsample=10000)
sample_plot(samples, cauchy)


# %%

samples = metropolis(weibull, nsample=10000, x0=0.01)
sample_plot(samples, weibull)
