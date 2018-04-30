# %%
%load_ext autoreload
%autoreload 2

%aimport numpy

# %%

t = [[0.3, 0.3, 0.4], [0.1, 0.9, 0.], [0.1, 0.5, 0.4]]
p = numpy.matrix(t)

eigenvalues, eigenvectors = numpy.linalg.eig(p)
eigenvalues
eigenvectors
d = numpy.diag(eigenvalues)
e = numpy.matrix(eigenvectors)
e_inv = numpy.linalg.inv(e)

d_t = d**100
e * d_t * e_inv

p**100

# %%

p*eigenvectors[:,1]
eigenvalues[1]*eigenvectors[:,1]

# %%

one = numpy.matrix([[1], [1], [1]])
p*one
