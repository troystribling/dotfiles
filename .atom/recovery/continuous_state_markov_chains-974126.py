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

def cummean(α, σ, x0, nsample=100):
    samples = ar_1_series(α, σ, x0, nsample)
    mean = numpy.zeros(nsample)
    mean[0] = samples[0]
    for i in range(1, len(samples)):
        mean[i] = (float(i) * mean[i - 1] + samples[i])/float(i + 1)
    return mean

def cumsigma(α, σ, x0, nsample=100):
    samples = ar_1_series(α, σ, 5.0, nsample)
    var = numpy.zeros(nsample)
    var[0] = samples[0]**2
    for i in range(1, len(samples)):
        var[i] = (float(i) * var[i - 1] + samples[i]**2)/float(i + 1)
    return numpy.sqrt(var)

def ar_1_equilibrium_distribution(α, σ, y):
    σ = equilibrium_standard_deviation(α, σ)
    p = numpy.zeros(len(y))
    for i in range(0, len(y)):
        ε  = y[i]**2 / ( 2.0 * σ**2)
        p[i] = numpy.exp(-ε) / numpy.sqrt(2 * numpy.pi * σ**2)
    return  p

# %%

σ = 1.0
x0 = 1.0
αs = [0.1, 0.6, 0.9]

figure, axis = pyplot.subplots(3, sharex=True, sharey=True, figsize=(12, 9))
axis[0].set_title(f"AR(1) Time Series", fontsize=15)
axis[2].set_xlabel("Time", fontsize=13)

for i in range(0, len(αs)):
    α = αs[i]
    samples = ar_1_series(α, σ, x0, 1000)
    axis[i].set_xlim([0, 1000])
    axis[i].set_ylim([-7.0, 7.0])
    axis[i].grid(True, zorder=5)
    axis[i].tick_params(labelsize=12)
    axis[i].text(50, 5.2, f"α={α}", fontsize=15)
    axis[i].plot(range(0, len(samples)), samples, color="#40A6FB", lw="2", zorder=10)

# %%
σ = 10.0
x0 = 1.0
α = 1.002

samples = ar_1_series(α, σ, x0, 1000)

figure, axis = pyplot.subplots(figsize=(12, 6))
axis.set_xlabel("Time", fontsize=14)
axis.set_xlim([0, 1000])
axis.set_title("AR(1) Time Series", fontsize=15)
axis.tick_params(labelsize=13)
axis.grid(True, zorder=5)
axis.plot(range(0, len(samples)), samples, color="#40A6FB", lw="2", zorder=10)


# %%

σ = 1.0
x0 = 5.0
αs = [0.1, 0.6, 0.9]
colors = ["#40A6FB", "#59CD31", "#E03A29"]
nsample = 10000

figure, axis = pyplot.subplots(figsize=(12, 6))
axis.set_xlabel("Time", fontsize=14)
axis.tick_params(labelsize=13)
axis.set_ylabel(r"$μ_E$", fontsize=14)
axis.set_title(r"AR(1) Cumulative $μ_E$", fontsize=15)
axis.grid(True, zorder=5)
axis.set_xlim([1.0, nsample])

for i in range(0, len(αs)):
    α = αs[i]
    mean = cummean(α, σ, x0, nsample)
    axis.semilogx(range(0, len(mean)), mean, color=colors[i], label=f"α={α}", lw="3", zorder=10)
    mean = cummean(α, σ, -x0, nsample)
    axis.semilogx(range(0, len(mean)), mean, color=colors[i], lw="3", zorder=10)
axis.legend(bbox_to_anchor=(0.95, 0.95), fontsize=15)

# %%

σ = 1.0
x0 = 5.0
αs = [0.1, 0.6, 0.9]
colors = ["#40A6FB", "#59CD31", "#E03A29"]
nsample = 10000

figure, axis = pyplot.subplots(figsize=(12, 6))
axis.set_xlabel("Time")
axis.tick_params(labelsize=13)
axis.set_ylabel(r"$σ_E$", fontsize=14)
axis.set_title(r"AR(1) Cumulative $σ_E$", fontsize=15)
axis.grid(True, zorder=5)
axis.set_xlim([1.0, nsample])

for i in range(0, len(αs)):
    α = αs[i]
    sigma = cumsigma(α, σ, x0, nsample)
    time = range(0, len(sigma))
    axis.semilogx(time, sigma, color=colors[i], label=f"α={α}", lw="3", zorder=10)
    γ = equilibrium_standard_deviation(α, σ)
    axis.semilogx(range(0, len(sigma)), numpy.full((nsample), γ), color=colors[i], lw="3", zorder=10)
axis.legend(bbox_to_anchor=(0.95, 0.95), fontsize=15)

# %%

σ = 1.0
α = 0.5
nsamples = 500
x0 = 5.0

steps = [[0, 1, 2, 3, 5], [10, 15, 20, 25, 30], [40, 50, 60, 70, 80], [100, 200, 300, 400]]
colors = ["#C7011A", "#EDD914", "#59CD31", "#148AED"]
alpha = alpha_steps(len(colors))
y = y_steps(α, σ, 200)

kernel_mean = ar_1_equilibrium_distributions(α, σ, x0, y, nsamples)

figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("y", fontsize=14)
axis.set_ylabel(r'$\pi$(y)', fontsize=14)
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
bbox = dict(boxstyle='square,pad=1', facecolor='white', alpha=0.7, edgecolor="lightgrey")
axis.text(-5.75, 0.1, f"Time Steps={nsamples}\nα={α}\nσ={σ}\nx={x0}", fontsize=14, bbox=bbox)
axis.legend(bbox_to_anchor=(0.225, 1.0), fontsize=14)

# %%
x0 = -5.0

kernel_mean = ar_1_equilibrium_distributions(α, σ, x0, y, nsamples)

figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("y", fontsize=14)
axis.set_ylabel(r'$\pi$(y)', fontsize=14)
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
bbox = dict(boxstyle='square,pad=1', facecolor='white', alpha=0.7, edgecolor="lightgrey")
axis.text(2.75, 0.1, f"Time Steps={nsamples}\nα={α}\nσ={σ}\nx0={x0}", fontsize=14, bbox=bbox)
axis.legend(bbox_to_anchor=(0.89, 1.0), fontsize=14)

# %%

α = 0.5
nsteps = 100
kernel_mean = ar_1_equilibrium_distributions(α, σ, 5.0, y, nsteps)
π_eq = ar_1_equilibrium_distribution(α, σ, y)

figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("y", fontsize=14)
axis.tick_params(labelsize=13)
axis.set_ylabel(r'$\pi$(y)', fontsize=14)
axis.set_title("Equilbrium PDF Comparison", fontsize=15)
axis.grid(True, zorder=5)
axis.plot(y, π_eq, color="#000000", lw="3", label=r"$π_E$", zorder=10)
axis.plot(y, kernel_mean[-1], color="#C7011A", lw="3", label=f"Kernel Mean", zorder=10)
bbox = dict(boxstyle='square,pad=1', facecolor='white', alpha=0.7, edgecolor="lightgrey")
axis.text(-5.5, 0.1, f"Time Steps={nsteps}\nα={α}\nσ={σ}", fontsize=14, bbox=bbox)
axis.legend(bbox_to_anchor=(0.95, 0.95), fontsize=14)

# %%

α = 0.5
kernel_mean = ar_1_equilibrium_distributions(α, σ, 5.0, y, 500)

samples = ar_1_series(α, σ, 5.0, 1000000)
figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("y", fontsize=14)
axis.set_ylabel(r'$\pi$(y)', fontsize=14)
axis.tick_params(labelsize=13)
axis.set_title("Equilbrium PDF Comparison", fontsize=15)
axis.grid(True, zorder=5)
_, x_values, _ = axis.hist(samples, 50, density=True, color="#348ABD", alpha=0.6, edgecolor="#348ABD", label=f"Sampled Density", lw="3", zorder=10)
axis.plot(y, kernel_mean[-1], color="#C7011A", lw="3", label=f"Kernel Mean", zorder=10)
axis.legend(bbox_to_anchor=(1.0, 1.0), fontsize=14)
