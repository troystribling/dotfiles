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

def ar_1_kernel(α, σ, x, y):
    p = numpy.zeros(len(y))
    for i in range(0, len(y)):
        ε  = ((y[i] -  α * x)**2) / ( 2.0 * σ**2)
        p[i] = numpy.exp(-ε) / numpy.sqrt(2 * numpy.pi * σ**2)
    return p

def ar_1_equilibrium_distributions(α, σ, x0, nsample=100, npts=100):
    p = []
    ymax = 5.0 * σ
    dy = 2.0 * ymax / nsample
    y = [-ymax + dy * i for i in range(0, npts)]
    for x in ar_1_series(α, σ, 5.0, nsample):
        py = ar_1_kernel(α, σ, x, y)
        p.append(py)

    psum = [p[i] + p[i-1] for i in range(1, len(p))]
    return psum

# %%

α = 0.5
σ = 1.0
npts = 200
nsample = 50

nplot = 1
nplots = int(nsample / nplot)
n = 0
np = 0

alpha_min = 0.1
alpha_max = 1.0
dalpha = (alpha_max - alpha_min) / nplots
alpha = [alpha_min + dalpha * i for i in range(0, nplots)]

# %%

figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("y")
axis.set_ylabel(r'$\pi$')
axis.set_title("AR(1) Relaxation to Equilibrium")
axis.grid(True, zorder=5)

p = ar_1_equilibrium_distributions(α, σ, 5.0, 10, 10)

# %%

figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("y")
axis.set_ylabel(r'$\pi$')
axis.set_title("AR(1) Relaxation to Equilibrium")
axis.grid(True, zorder=5)


# %%

samples = ar_1_series(α, σ, x0, 100000)
figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("Value")
axis.set_ylabel(r'$\pi_E$')
axis.set_title("Equilbrium PDF Comparison")
axis.grid(True, zorder=5)
_, x_values, _ = axis.hist(samples, 50, density=True, color="#348ABD", alpha=0.6, edgecolor="#348ABD", label=f"Sampled Density", lw="3", zorder=10)
axis.legend()
