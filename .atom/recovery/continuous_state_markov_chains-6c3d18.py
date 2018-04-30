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

def ar_1_kernel(α, σ, x, npts):
    ymax = 5.0 * σ
    ymin = -ymax
    p = numpy.zeros(npts)
    dy = (ymax - ymin) / npts
    for i in range(0, npts):
        y = ymin + dy * i
        ε  = ((y -  α * x)**2) / ( 2.0 * σ**2)
        p[i] = numpy.exp(ε) / numpy.sqrt(2 * numpy.pi * σ**2)
    return p

# %%
α = 0.5
σ = 0.5
x0 = 1.0
npts = 200
nsample = 100

nplot = 5
n = 0
p = numpy.zeros(npts)
o = numpy.ones(npts)

figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("y")
axis.set_ylabel(r'$\pi')
axis.set_title("AR(1) Relaxation to Equilibrium")
axis.grid(True, zorder=5)

for x in ar_1(α, σ, x0, nsample):
    n += 1
    p += ar_1_kernel(α, σ, x, npts)
