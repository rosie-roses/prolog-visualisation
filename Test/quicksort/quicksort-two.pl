quick_sort(InputList,SortedList):-
	InputList = [H|T],
	pivoting(H,T,L1,L2),quick_sort(L1,Sorted1),quick_sort(L2,Sorted2),
	append(Sorted1,[H|Sorted2], SortedList).