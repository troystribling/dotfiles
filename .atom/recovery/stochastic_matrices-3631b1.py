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

t = numpy.array([[0.0, 1.0],
                 [1.0, 0.0]])
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

eigenvalues, eigenvectors = numpy.linalg.eig(p);
eigenvalues
eigenvectors

eigenvalues, eigenvectors = numpy.linalg.eig(p.T);
eigenvalues
eigenvectors

p - numpy.eye(2)

s = numpy.concatenate((p.T - numpy.eye(2), [numpy.ones(2)]))
numpy.linalg.lstsq(s, numpy.array([0.0, 0.0, 1.0]), rcond=None)

# %%

t = [[0.3, 0.7], [0.1, 0.9]]
p = numpy.matrix(t)
p
p.T
p**100

right_eigenvalues, right_eigenvectors = numpy.linalg.eig(p)
right_eigenvalues
right_eigenvectors
p*right_eigenvectors[:,0]
right_eigenvalues[0]*right_eigenvectors[:,0]

p*right_eigenvectors[:,1]
right_eigenvalues[1]*right_eigenvectors[:,1]

left_eigenvalues, left_eigenvectors = numpy.linalg.eig(p.T)
left_eigenvalues
left_eigenvectors
p.T*left_eigenvectors[:,0]
left_eigenvalues[0]*left_eigenvectors[:,0]
p.T*left_eigenvectors[:,1]
left_eigenvalues[1]*left_eigenvectors[:,1]

# %%

one = numpy.matrix(numpy.ones(3)).T

t = [[0.3, 0.3, 0.4], [0.1, 0.9, 0.], [0.1, 0.5, 0.4]]
p = numpy.matrix(t)
p**100

s = numpy.concatenate((p.T - numpy.eye(3), [numpy.ones(3)]))
π, _, _, _ = numpy.linalg.lstsq(s, numpy.array([0.0, 0.0, 0.0, 1.0]), rcond=None)
π = numpy.matrix(π).T
π

π.T*p
one*π.T

one.T*π

right_eigenvalues, right_eigenvectors = numpy.linalg.eig(p)
right_eigenvalues
right_eigenvectors
d =  numpy.matrix(right_eigenvalues) * numpy.eye(3)


left_eigenvalues, left_eigenvectors = numpy.linalg.eig(p.T)
left_eigenvalues
left_eigenvectors

# %%
# not regular
t = [[1,1], [0,1]]
p = numpy.matrix(t)
p**100

t = [[0,1], [1,0]]
p = numpy.matrix(t)
p**100

# regular
t = [[1,1,0], [0,0,1], [1,0,0]]
p = numpy.matrix(t)
p**100

# %%
# Diagonalize matrix
