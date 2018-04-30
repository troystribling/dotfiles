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

def ar_1_equilibrium_distributions(α, σ, x0, y, nsample=100):
    py = [ar_1_kernel(α, σ, x, y) for x in ar_1_series(α, σ, x0, nsample)]
    pavg = []
    for i in range(0, len(py)):
        pavg_next = py[i] if i == 0 else (py[i] + i * pavg[i-1]) / (i + 1)
        pavg.append(pavg_next)
    return pavg

# %%

α = 0.75
σ = 1.0
npts = 100
nsample = 50

ymax = 5.0 * σ
dy = 2.0 * ymax / npts
y = [-ymax + dy * i for i in range(0, npts)]

nplot = 1
nplots = int(nsample / nplot)
n = 0
np = 0

alpha_min = 0.1
alpha_max = 1.0
dalpha = (alpha_max - alpha_min) / nplots
alpha = [alpha_min + dalpha * i for i in range(0, nplots)]

# %%

πs = ar_1_equilibrium_distributions(α, σ, 5.0, y, 500)

figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("y")
axis.set_ylabel(r'$\pi$')
axis.set_title("AR(1) Relaxation to Equilibrium")
axis.set_ylim([0, 0.5])
axis.grid(True, zorder=5)

for π in πs:
    axis.plot(y, π, color="#A60628", lw="3", zorder=10)
axis.plot(y, πs[-1], color="#000000", lw="3", zorder=10)

# %%

πs = ar_1_equilibrium_distributions(α, σ, -5.0, y, 500)

figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("y")
axis.set_ylabel(r'$\pi$')
axis.set_title("AR(1) Relaxation to Equilibrium")
axis.set_ylim([0, 0.5])
axis.grid(True, zorder=5)

for π in πs:
    axis.plot(y, π, color="#A60628", lw="3", zorder=10)
axis.plot(y, πs[-1], color="#000000", lw="3", zorder=10)


# %%

samples = ar_1_series(α, σ, 5.0, 1000000)
figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("Value")
axis.set_ylabel(r'$\pi_E$')
axis.set_title("Equilbrium PDF Comparison")
axis.grid(True, zorder=5)
_, x_values, _ = axis.hist(samples, 50, density=True, color="#348ABD", alpha=0.6, edgecolor="#348ABD", label=f"Sampled Density", lw="3", zorder=10)
axis.plot(y, πs[-1], color="#000000", lw="3", label=f"Kernel Mean", zorder=10)
axis.legend()
