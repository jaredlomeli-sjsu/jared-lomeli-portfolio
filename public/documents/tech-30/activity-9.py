import networkx as nx
import matplotlib.pyplot as plt

M = nx.Graph()
M.add_nodes_from([1, 2, 3, 4])
M.add_edges_from([(1, 2), (1, 3), (1, 4), (2, 3), (2, 4), (3, 4)])

print('Mesh Nodes:', M.nodes())
print('Mesh Edges:', M.edges())

nx.draw(M, with_labels=True)
plt.show()


S = nx.Graph()
S.add_nodes_from([1, 2, 3, 4, 5])
S.add_edges_from([(1, 2), (1, 3), (1, 4), (1, 5)])

print('Star Nodes:', S.nodes())
print('Star Edges:', S.edges())

nx.draw(S, with_labels=True)
plt.show()