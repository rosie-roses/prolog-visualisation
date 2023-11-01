transform(InputList, OutputList):-
    InputList = [X | T],
    wordpair(X, Y),
    transform(T, Result),
    OutputList = [Y | Result].