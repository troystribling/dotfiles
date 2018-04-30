# %%
%load_ext autoreload
%autoreload 2

%aimport numpy

# %%

t = [[0.3, 0.3, 0.4], [0.1, 0.9, 0.], [0.1, 0.5, 0.4]]
p = numpy.matrix(t)

right_eigenvalues, right_eigenvectors = numpy.linalg.eig(p)
right_eigenvalues
right_eigenvectors
d = numpy.diag(right_eigenvalues)
e = numpy.matrix(right_eigenvectors)
e_inv = numpy.linalg.inv(e)

d_t = d**100
e * d_t * e_inv

p**100


# %%

one = numpy.matrix([[1], [1], [1]])

one.T*p
