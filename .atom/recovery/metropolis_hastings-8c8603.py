# %%

import numpy
from matplotlib import pyplot
from scipy import stats

%matplotlib inline

# %%

def metropolis_hastings(p, q, qsample, nsample=10000, x0=0.0):
    x = x0
    samples = numpy.zeros(nsample)
    for i in range(0, nsample):
        
    return samples
