# %%
%load_ext autoreload
%autoreload 2

%aimport numpy
%aimport sympy
%aimport scipy

from matplotlib import pyplot

%matplotlib inline

# %%

def ar_1_series(α, σ, x0, nsample=100):
    samples = numpy.zeros(nsample)
    ε = numpy.random.normal(0.0, σ, nsample)
    i = 1
    samples[0] = x0
    while i < nsample:
        samples[i] = α * samples[i-1] + ε[i]
        i += 1
    return samples

def ar_1_kernel(α, σ, x, ymin, ymax, npts):
    p = numpy.zeros(npts)
    dy = (ymax - ymin) / npts
    for i in range(0, npts):
        y = ymin + dy * i
        ε  = ((y -  α * x)**2) / ( 2.0 * σ**2)
        p = 
    return p

# %%

for x in ar_1(0.5, 0.5, 1.0, 100):
