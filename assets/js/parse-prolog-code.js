const pl = require('tau-prolog');
const peg = require('pegjs');

document.addEventListener('DOMContentLoaded', () => {
    var textarea = document.querySelector('.code-input-area');
    var visualiseButton = document.querySelector('.visualise-button');

    function extractNodesAndEdges(ast) {
        const nodes = [];
        const edges = [];

        function addEdge(source, target) {
            edges.push({ source, target });
        }

        function traverse(node, parentIndex = null) {
            const currentIndex = nodes.length + 1;
            
            if (!Array.isArray(node)) {

                if (node.type === 'Variable') {
                    const existingNode = nodes.find((n) => n.type === 'Variable' && n.value === node.value);
                    if (existingNode) {
                        if (parentIndex !== null) {
                            addEdge(parentIndex, nodes.indexOf(existingNode) + 1);
                        }
                        return;
                    }
                }

                nodes.push({ ...node, id: currentIndex });
    
                if (parentIndex !== null) {
                    addEdge(parentIndex, currentIndex);
                }

                if ((node.type && node["type"].hasOwnProperty("list"))) {
                    if (node.type.list) {
                        let listNodeId = nodes.length + 1;
                        const newNode = {
                            list: node.type.list,
                            id: listNodeId
                        }
                        nodes.push(newNode);
                        addEdge(currentIndex, listNodeId);
                        const firstListNodeIndex = nodes.length;
                        node.type.list.forEach((listNode) => {
                            traverse(listNode, firstListNodeIndex);
                        });
                    }
                }
                else if (node.type === 'Predicate') {
                    const args = node.arguments;
                    if (args) {
                        const firstArgIndex = nodes.length;
                        args.forEach((arg) => {
                            traverse(arg, firstArgIndex);
                        });
                    }
                }
                else if (node.type === 'Condition') {
                    const left = node.leftOperand;
                    const right = node.rightOperand;
                    const operands = [left, right];
                    if (operands) {
                        const firstOperandIndex = nodes.length;
                        operands.forEach((operand) => {
                            traverse(operand, firstOperandIndex);
                        });
                    }
                }
                   
            } else {
                node.forEach((subnode) => {
                    traverse(subnode, parentIndex);
                });
            }
        }

        ast.forEach(rule => {
            rule[0].body.forEach((node) => {
                traverse(node);
            });
        });

        return { nodes, edges }
    }

    function topologicalSort(nodes) {
        const arrayNodes = [];
        const nonArrayNodes = [];

        nodes.forEach((node) => {
            if ((node.type && node["type"].hasOwnProperty("list")) || Array.isArray(node["list"]) 
            || Array.isArray(node.arguments)) {
                arrayNodes.push(node);
            } else {
                nonArrayNodes.push(node);
            }
        });

        arrayNodes.sort((a, b) => a.id - b.id);
        
        const combinedNodes = [...arrayNodes, ...nonArrayNodes];
        
        return combinedNodes;
    }

    function getNodeLabel(node) {
        if (node.name) {
            return node.name;
        } else if (node.value) {
            return node.value;
        } else if (node.operator) {
            return node.operator
        } else {
            return "List";
        }
    }

    let svg = null; 

    // Function to remove the previous graph
    function removePreviousGraph() {
        if (svg) {
            svg.selectAll("*").remove(); // Remove all elements within the SVG
            svg.remove(); // Remove the SVG element itself
            svg = null; // Reset the reference to the SVG element
        }
    }

    function isPredicate(node) {
        return node.type === 'Predicate';
    }

    function isArray(node) {
        if ((node.type && node["type"].hasOwnProperty("list")) || Array.isArray(node["list"]) 
            || Array.isArray(node.arguments)) {
            return true;
        } else {
            return false;
        }
    }

    function visualiseGraph(sortedNodes, edges) {
        removePreviousGraph();

        var width = document.getElementById('graphical-layout-area').offsetWidth, height = 800;
    
        svg = d3.select("#graphical-layout-area")
            .append("svg")
            .attr('viewBox', [-width / 2, -height / 2, width, height])
            .attr("width", width)
            .attr("height", height)
            .attr('style', 'max-width: 100%; height: auto; font: 14px monospace;');    

        // Define a D3 force simulation for positioning nodes and edges
        const simulation = d3
            .forceSimulation(sortedNodes)
            .force('link', d3.forceLink(edges).id(d => d.id).distance(400))
            .force('charge', d3.forceManyBody())
            .on("tick", ticked);


        sortedNodes.forEach(d => {
            const labelLength = getNodeLabel(d).length; // Calculate the length of the label
            if (labelLength === 1) {
                d.radius = 15;
            } 
            else if (labelLength === 2) {
                d.radius = 25;
            }
            else {
                d.radius = labelLength * 6; // Define a scale factor for the radius
            }
        });
    
        // Create links (edges)
        const links = svg
            .selectAll('.link')
            .data(edges)
            .enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke', '#444')
            .attr('stroke-width', 2);

        // Create nodes
        const shapes = svg
            .selectAll('.shape')
            .data(sortedNodes)
            .enter()
            .append('g')
            .attr('class', 'shape')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));


        // Create squares for predicate nodes
        shapes
            .filter(d => isPredicate(d))
            .append('rect')
            .attr('width', d => d.radius * 2)
            .attr('height', d => d.radius * 2)
            .attr('x', d => -d.radius)
            .attr('y', d => -d.radius)
            .attr('fill', 'white')
            .attr('stroke', 'black')
            .attr('stroke-width', 2);

        // Create circles for other nodes
        shapes
            .filter(d => !isPredicate(d))
            .append('circle')
            .attr('fill', 'white')
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .attr('r', d => d.radius);

        shapes
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em') // Adjust the vertical alignment as needed
            .text(d => getNodeLabel(d));
    
        function ticked() {
            shapes.attr("transform", d => `translate(${d.x},${d.y})`);
            links
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
        }  
        
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
    
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
    
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
        }

        // Start the simulation
        simulation.restart();
    }

    // When visualise button is clicked parse the inputted prolog code in the textarea.
    visualiseButton.addEventListener('click', () => {
        const startTime = performance.now();
        const inputtedCode = textarea.value;
        const ast = []; // Initialise array to store the abstract syntax tree (AST).
        fetch(`/parser/grammar.pegjs`) // Fetch the grammar file.
        .then((response) => response.text())
        .then((grammar) => {
            const startTimeParsing = performance.now();
            const session = pl.create(); // Create a Prolog session.
            session.consult(inputtedCode);
            const rulesArr = Object.values(session.rules); // Extract the rules from the session.
            const parser = peg.generate(grammar); // Generate parser using the grammar.

            // Iterate the rules from session to grab each rule object.
            for (arr of rulesArr) {
                for (let i = 0; i < arr.length; i++) {
                    const clauseObj = arr[i];
                    const clauseStr = clauseObj.toString();
                    console.log(clauseStr)
                    try {
                        const astNode = parser.parse(clauseStr); 
                        ast.push(astNode);
                    } catch (err) {
                        // If error occurred when parsing rules.
                        console.log('Error parsing rule: ', err);
                    }
                }
            }
            const endTimeParsing = performance.now();
            console.log('Time taken for parsing (ms):', endTimeParsing - startTimeParsing);

            console.log('AST to extract:\n', ast);

            const { nodes, edges } = extractNodesAndEdges(ast);

            // Check if the second-to-last node has the name "OutputList"
            if (nodes.length >= 2 && nodes[nodes.length - 2].name === "OutputList") {
                // Swap the second-to-last and last nodes
                const tempNode = nodes[nodes.length - 2];
                nodes[nodes.length - 2] = nodes[nodes.length - 1];
                nodes[nodes.length - 1] = tempNode;
            
                // Swap the IDs of the nodes
                const tempId = nodes[nodes.length - 2].id;
                nodes[nodes.length - 2].id = nodes[nodes.length - 1].id;
                nodes[nodes.length - 1].id = tempId;
            
                // Update edge IDs to reflect the changes
                for (const edge of edges) {
                    if (edge.source === tempNode.id) {
                        edge.source = nodes[nodes.length - 2].id;
                    } else if (edge.source === nodes[nodes.length - 2].id) {
                        edge.source = tempNode.id;
                    }
                
                    if (edge.target === tempNode.id) {
                        edge.target = nodes[nodes.length - 2].id;
                    } else if (edge.target === nodes[nodes.length - 2].id) {
                        edge.target = tempNode.id;
                    }
                }
            }

            console.log('Unsorted nodes: ', nodes);
            // Perform topological sorting
            const sortedNodes = topologicalSort(nodes, edges);

            console.log('Topologically Sorted Nodes:\n', sortedNodes);
            console.log('Edges:\n', edges);

            visualiseGraph(sortedNodes, edges);
            const endTime = performance.now();
            console.log('Total Time taken for visualisation (ms):', endTime - startTime);

        }).catch((err) => {
            console.log('Error fetching grammar file: ' + err); // If error occurred when fetching grammar file.
        });
    });
});