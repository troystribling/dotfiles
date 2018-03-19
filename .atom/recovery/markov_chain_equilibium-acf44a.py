# %%
%load_ext autoreload
%autoreload 2

%aimport numpy
%aimport pygraphviz
%aimport sympy

from matplotlib import pyplot
from IPython.display import Image

%matplotlib inline

def draw(dot):
    return Image(pygraphviz.AGraph(dot).draw(format='png', prog='dot'))

# %%

g1 = """digraph markov_chain {
   size="5,6";
   ratio=fill;
   node[fontsize=24, fontname=Helvetica];
   edge[fontsize=24, fontname=Helvetica];
   graph[fontsize=24, fontname=Helvetica];
   labelloc="t";
   label="Markov Transition Matrix";
   0 -> 1 [label=" 0.9"];
   0 -> 2 [label=" 0.1"];
   1 -> 0 [label=" 0.8"];
   1 -> 1 [label=" 0.1"];
   1 -> 3 [label=" 0.1"];
   2 -> 1 [label=" 0.5"];
   2 -> 2 [label=" 0.3"];
   2 -> 3 [label=" 0.2"];
   3 -> 0 [label=" 0.1"];
   3 -> 3 [label=" 0.9"];
}"""
draw(g1)

# %%

t = [[0.0, 0.9, 0.1, 0.0],
     [0.8, 0.1, 0.0, 0.1],
     [0.0, 0.5, 0.3, 0.2],
     [0.1, 0.0, 0.0, 0.9]]
p = numpy.matrix(t)

# %%

def next_state(tpm, up, xt):
    txp = 0.0
    _, ncols = tpm.shape
    for xt1 in range(0, ncols):
        txp += tpm[xt, xt1]
        if up <= txp:
            return xt1
    return None

def sample_chain(p, x0, nsample):
    xt = numpy.zeros(nsample, dtype=int)
    up = numpy.random.rand(nsample)
    xt[0] = x0
    for i in range(0, nsample - 1):
        xt1 = next_state(p, up[i], xt[i])
        if xt1 is None:
            continue
        xt[i + 1] = xt1
    return xt

def inv_cdf(π, x):
    intervals = []
    πlb = 0.0
    nπ, _ = π.shape
    for i in range(0, nπ - 1):
        intervals.append((i, sympy.Interval(πlb, πlb + π[i, 0], False, True).contains(x)))
        πlb += π[i, 0]
    intervals.append((nπ - 1, sympy.Interval(πlb, 1.0, False, False).contains(x)))
    return sympy.Piecewise(*intervals)

def eq_dist(π, p, nsteps):
    πi = π.T
    result = [πi]
    for i in range(0, nsteps):
        πi = πi * p
        result.append(πi)
    return result

# %%

nsamples = 100000
x0 = 1
chain_samples = sample_chain(p, x0, nsamples)

figure, axis = pyplot.subplots(figsize=(6, 5))
axis.set_xlabel("State")
axis.set_ylabel("PDF")
axis.set_title(f"Markov Chain PDF {nsamples} Samples")
axis.set_xlim([-0.5, 3.5])
axis.grid(True, zorder=5)
axis.set_xticks([0, 1, 2, 3])
_ = axis.hist(chain_samples - 0.5, [-0.5, 0.5, 1.5, 2.5, 3.5], density=True, color="#348ABD", alpha=0.6, label=f"Sampled Density", edgecolor="#348ABD", lw="3", zorder=10)


# %%

nsamples = 10000
x = sympy.symbols('x')
c = [[0.1],
     [0.5],
     [0.35],
     [0.05]]
π = numpy.matrix(c)
π[1, 0]

π_inv_cdf = inv_cdf(π, x)
x_values = [i / 100 for i in range(0, 101)]
π_values = [π_inv_cdf.subs(x, i) for i in x_values]
π_values[50]
figure, axis = pyplot.subplots(figsize=(6, 5))
axis.set_xlabel("State")
axis.set_ylabel("PDF")
axis.set_title(f"π PDF")
axis.set_xlim([-0.5, 3.5])
axis.set_xticks([0, 1, 2, 3])
axis.grid(True, zorder=5)
axis.bar([0, 1.0, 2.0, 3.0], [0.1, 0.5, 0.35, 0.05], 1.0, color="#A60628", label="π", alpha=0.6, lw="3", edgecolor="#A60628", zorder=10)

# %%

nsamples = 10000
x = sympy.symbols('x')
c = [[0.1],
     [0.5],
     [0.35],
     [0.05]]
π = numpy.matrix(c)
π_inv_cdf = inv_cdf(π, x)
π_samples = [int(π_inv_cdf.subs(x, i)) for i in numpy.random.rand(nsamples)]
figure, axis = pyplot.subplots(figsize=(6, 5))
axis.set_xlabel("State")
axis.set_ylabel("PDF")
axis.set_title(f"π Sampled Inverse CDF {nsamples}")
axis.grid(True, zorder=5)
axis.set_xticks([0, 1, 2, 3])
_ = axis.hist(π_samples, [-0.5, 0.5, 1.5, 2.5, 3.5], density=True, color="#A60628", alpha=0.6, label=f"Sampled Density", edgecolor="#A60628", lw="3", zorder=10)


# %%
nsteps = 50
c = [[0.1],
     [0.5],
     [0.35],
     [0.05]]
π = numpy.matrix(c)
πt = eq_dist(π, p, nsteps)

def relaxation_plot(πt, nsteps):
    steps = [i for i in range(0, nsteps + 1)]
    figure, axis = pyplot.subplots(figsize=(12, 5))
    axis.set_xlabel("Iterations")
    axis.set_ylabel("Probability")
    axis.set_title("Relaxation to Equlibrium Distribution")
    axis.grid(True, zorder=5)
    axis.set_xlim([0, nsteps])
    axis.plot(steps, [πt[i][0,0] for i in steps], color="#A60628", label=f"State 0", lw="3", zorder=10)
    axis.plot(steps, [πt[i][0,1] for i in steps], color="#348ABD", label=f"State 1", lw="3", zorder=10)
    axis.plot(steps, [πt[i][0,2] for i in steps], color="#1EAA0B", label=f"State 2", lw="3", zorder=10)
    axis.plot(steps, [πt[i][0,3] for i in steps], color="#AA0BAA", label=f"State 3", lw="3", zorder=10)
    axis.legend()

relaxation_plot(πt, nsteps)

# %%

nsteps = 50
c = [[0.25],
     [0.25],
     [0.25],
     [0.25]]
π = numpy.matrix(c)
πt = eq_dist(π, p, nsteps)
relaxation_plot(πt, nsteps)


# %%

πsamples = 1000
nsamples = 10000
c = [[0.25],
     [0.25],
     [0.25],
     [0.25]]
π = numpy.matrix(c)
π_inv_cdf = inv_cdf(π, x)
π_samples = [int(π_inv_cdf.subs(x, i)) for i in numpy.random.rand(πsamples)]

chain_samples = numpy.array([])
for x0 in π_samples:
    chain_samples = numpy.append(chain_samples, sample_chain(p, x0, nsamples))

figure, axis = pyplot.subplots(figsize=(6, 5))
axis.set_xlabel("State")
axis.set_ylabel("PDF")
axis.set_title(f"Markov Chain Equilbrium PDF")
axis.set_xlim([-0.5, 3.5])
axis.grid(True, zorder=5)
axis.set_xticks([0, 1, 2, 3])
simpulated_pdf, _, _  = axis.hist(chain_samples - 0.5, [-0.5, 0.5, 1.5, 2.5, 3.5], density=True, color="#348ABD", alpha=0.6, label=f"Sampled Density", edgecolor="#348ABD", lw="3", zorder=10)

# %%

nsteps = 50
πt = eq_dist(π, p, nsteps)
_, nπ = πt[nsteps].shape
computed_pdf = [πt[50][0, i] for i in range(0, nπ)]
states = numpy.array([0, 1, 2, 3])

figure, axis = pyplot.subplots(figsize=(12, 5))
axis.set_xlabel("State")
axis.set_ylabel("PDF")
axis.set_title("PDF Comparison")
axis.grid(True, zorder=5)
axis.bar(states - 0.2, computed_pdf, 0.4, color="#A60628", label=r'$\pi^T P^t$', alpha=0.6, lw="3", edgecolor="#A60628", zorder=10)
axis.bar(states + 0.2, simpulated_pdf, 0.4, color="#348ABD", label="Simulated PDF", alpha=0.6, lw="3", edgecolor="#348ABD", zorder=10)
axis.legend()


# %%
