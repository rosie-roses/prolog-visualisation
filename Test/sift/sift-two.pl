sift(InputList, Threshold, FilteredList):-
   InputList = [X | Tail],
   X =< Threshold,
   sift(Tail, Threshold, FilteredList).