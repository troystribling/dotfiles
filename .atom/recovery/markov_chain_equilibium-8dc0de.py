# %%
%load_ext autoreload
%autoreload 2

%aimport numpy
%aimport pygraphviz

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
   1 -> 2 [label=" 0.9"];
   1 -> 3 [label=" 0.1"];
   2 -> 1 [label=" 0.8"];
   2 -> 2 [label=" 0.1"];
   2 -> 4 [label=" 0.1"];
   3 -> 2 [label=" 0.5"];
   3 -> 3 [label=" 0.3"];
   3 -> 4 [label=" 0.2"];
   4 -> 1 [label=" 0.1"];
   4 -> 4 [label=" 0.9"];
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
    for xt1 in range(0, len(tpm[xt])):
        txp += tpm[xt, xt1]
        if up <= txp:
            return xt1
    return None

def sample_chain(p, x0, nsample):
    xt = numpy.zeros(nsample)
    up = numpy.random.rand(nsample):
    xt[0] = x0
    for i in range(0, nsamples - 1):
        xt[i + 1] = next_state(p, up, xt[i])
