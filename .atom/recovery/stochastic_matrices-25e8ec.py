# %%
%load_ext autoreload
%autoreload 2

%aimport numpy
%aimport sympy

from matplotlib import pyplot
from IPython.display import Image

%matplotlib inline

# %%

t = [[0.0, 0.9, 0.1, 0.0],
     [0.8, 0.1, 0.0, 0.1],
     [0.0, 0.5, 0.3, 0.2],
     [0.1, 0.0, 0.0, 0.9]]
p = numpy.matrix(t)

p.T

c = [[0.3],
     [0.1],
     [0.4],
     [0.2]]
π = numpy.matrix(c)
p**100
π.T * p**100

c = [[0.4],
     [0.1],
     [0.2],
     [0.3]]
π = numpy.matrix(c)
π.T * p**100

eigenvalues, eigenvectors = numpy.linalg.eig(p)
eigenvalues
eigenvectors

eigenvalues, eigenvectors = numpy.linalg.eig(p.T)
eigenvalues
eigenvectors

# %%

c = [[0.25],
     [0.25],
     [0.25],
     [0.25]]
π = numpy.matrix(c)
p * π

p * p * π

# %%

t = [[0.0, 1.0],
     [1.0, 0.0]]
p = numpy.matrix(t)

p**100

eigenvalues, eigenvectors = numpy.linalg.eig(p)
eigenvalues
eigenvectors

# %%

t = [[0.7, 0.3],
     [0.4, 0.6]]
p = numpy.matrix(t)

p**100
p.T**100
p - numpy.eye(2)

eigenvalues, eigenvectors = numpy.linalg.eig(p)
eigenvalues
eigenvectors

eigenvalues, eigenvectors = numpy.linalg.eig(p.T)
eigenvalues
eigenvectors

p - numpy.eye(2)
numpy.linalg.solve([[-0.3, 0.3], [0.4, -0.4], [1.0, 1.0]], [0.0, 0.0, 1.0])

a = numpy.array([[3,1], [1,2]])
b = numpy.array([9,8])
x = numpy.linalg.solve(a, b)
x
