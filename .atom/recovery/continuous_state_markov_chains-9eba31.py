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

def alpha_steps(nplots):
    alpha_min = 0.5
    alpha_max = 0.8
    dalpha = (alpha_max - alpha_min) / (nplots - 1)
    return [alpha_min + dalpha * i for i in range(0, nplots)]

def y_steps(α, σ, npts):
    γ = equilibrium_standard_deviation(α, σ)
    ymax = 5.0 * γ
    dy = 2.0 * ymax / (npts - 1)
    return [-ymax + dy * i for i in range(0, npts)]

def equilibrium_standard_deviation(α, σ):
    return numpy.sqrt(σ**2/(1.0 - α**2))

σ = 1.0
samples = ar_1_series(0.5, σ, -5.0, 1000)

figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("Steps")
axis.set_ylabel("Value")
axis.set_title("AR(1) Time Series")
axis.grid(True, zorder=5)
axis.plot(range(0, len(samples)), samples, color="#000000", lw="2", zorder=10)

# %%
σ = 1.0
samples = ar_1_series(0.99, σ, -5.0, 1000)

figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("Steps")
axis.set_ylabel("Value")
axis.set_title("AR(1) Time Series")
axis.grid(True, zorder=5)
axis.plot(range(0, len(samples)), samples, color="#000000", lw="2", zorder=10)

# %%

σ = 1.0
α = 0.5
nsamples = 500

steps = [[0, 1, 2, 3, 5], [10, 15, 20, 25, 30], [40, 50, 60, 70, 80], [100, 200, 300, 400]]
colors = ["#C7011A", "#EDD914", "#14ED1B", "#148AED"]
alpha = alpha_steps(len(colors))
y = y_steps(α, σ, 200)

kernel_mean = ar_1_equilibrium_distributions(α, σ, 5.0, y, nsamples)

figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("y", fontsize=14)
axis.set_ylabel(r'$\pi$', fontsize=14)
axis.set_title(f"AR(1) Relaxation to Equilibrium", fontsize=15)
axis.set_ylim([0, 0.45])
axis.tick_params(labelsize=13)
axis.grid(True, zorder=5)

for i in range(0, len(steps)):
    sub_steps = steps[i]
    axis.plot(y, kernel_mean[sub_steps[0]], color=colors[i], lw="2", alpha=alpha[i], label=f"t={sub_steps[0]}-{sub_steps[-1]}", zorder=6)
    for j in range(1, len(sub_steps)):
        axis.plot(y, kernel_mean[sub_steps[j]], color=colors[i], lw="2", zorder=6, alpha=alpha[i])
axis.plot(y, kernel_mean[-1], color="#000000", lw="4", label=f"t={nsamples}", zorder=10, alpha=alpha[i])
axis.text(-5.75, 0.125, f"Total Time Steps={nsamples}\nα={α}\nσ={σ}", fontsize=14, bbox=dict(boxstyle='square,pad=1', facecolor='white', alpha=0.7, edgecolor="lightgrey"))
axis.legend(bbox_to_anchor=(0.225, 1.0), fontsize=14)


# %%

kernel_mean = ar_1_equilibrium_distributions(α, σ, -5.0, y, nsamples)

figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("y", fontsize=14)
axis.set_ylabel(r'$\pi$', fontsize=14)
axis.set_title(f"AR(1) Relaxation to Equilibrium", fontsize=15)
axis.set_ylim([0, 0.45])
axis.tick_params(labelsize=13)
axis.grid(True, zorder=5)

for i in range(0, len(steps)):
    sub_steps = steps[i]
    axis.plot(y, kernel_mean[sub_steps[0]], color=colors[i], lw="2", alpha=alpha[i], label=f"t={sub_steps[0]}-{sub_steps[-1]}", zorder=6)
    for j in range(1, len(sub_steps)):
        axis.plot(y, kernel_mean[sub_steps[j]], color=colors[i], lw="2", zorder=6, alpha=alpha[i])
axis.plot(y, kernel_mean[-1], color="#000000", lw="4", label=f"t={nsamples}", zorder=10, alpha=alpha[i])
axis.text(2.75, 0.125, f"Total Time Steps={nsamples}\nα={α}\nσ={σ}", fontsize=14, bbox=dict(boxstyle='square,pad=1', facecolor='white', alpha=0.7, edgecolor="lightgrey"))
axis.legend(bbox_to_anchor=(0.89, 1.0), fontsize=14)

# %%
α = 0.5
γ = numpy.sqrt(σ**2/(1.0 - α**2))

nsteps = 2000
samples = ar_1_series(α, σ, 5.0, nsteps)

mean = numpy.zeros(nsteps)
mean[0] = samples[0]
for i in range(1, len(samples)):
    mean[i] = (float(i) * mean[i - 1] + samples[i])/float(i + 1)


figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("Steps")
axis.set_ylabel("Value")
axis.set_title("AR(1) Mean")
axis.grid(True, zorder=5)
axis.plot(range(0, len(mean)), mean, color="#000000", lw="2", zorder=10)


# %%

α = 0.5
γ = numpy.sqrt(σ**2/(1.0 - α**2))

nsteps = 2000
samples = ar_1_series(α, σ, 5.0, nsteps)

var = numpy.zeros(nsteps)
var[0] = samples[0]**2
for i in range(1, len(samples)):
    var[i] = (float(i) * var[i - 1] + samples[i]**2)/float(i + 1)

numpy.full((nsteps), γ**2)

figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("Steps")
axis.set_ylabel("Value")
axis.set_title("AR(1) Variance")
axis.grid(True, zorder=5)
axis.plot(range(0, len(var)), var, color="#000000", lw="2", zorder=10)
axis.plot(range(0, len(var)), numpy.full((nsteps), γ**2), color="#A60628", lw="2", zorder=10)

# %%
α = 0.5
kernel_mean = ar_1_equilibrium_distributions(α, σ, 5.0, y, 500)
samples = ar_1_series(α, σ, 5.0, 1000000)
figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("Value")
axis.set_ylabel(r'$\pi_E$')
axis.set_title("Equilbrium PDF Comparison")
axis.grid(True, zorder=5)
_, x_values, _ = axis.hist(samples, 50, density=True, color="#348ABD", alpha=0.6, edgecolor="#348ABD", label=f"Sampled Density", lw="3", zorder=10)
axis.plot(y, kernel_mean[-1], color="#000000", lw="3", label=f"Kernel Mean", zorder=10)
axis.legend()
