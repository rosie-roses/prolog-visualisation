{
   function head(name, args) {
    return {
      arguments: args
    };
  }

  function atom(value) {
    return {
      type: "Atom",
      value
    };
  }

  function variable(value) {
    return {
      type: "Variable",
      value
    };
  }

  function list(head, tail) {
    return {
      list: [
        head,
        tail
      ]
    };
  }

  function predicate(name, args) {
    return {
      type: 'Predicate',
      name,
      arguments: args
    };
  }

  function unify(type, name) {
    return {
      type,
      name
    }
  }

  function condition(operator, left, right) {
    return {
      type: 'Condition',
      operator: operator,
      leftOperand: left,
      rightOperand: right
    };
  }
}

Start
  = Rule*

Rule
  = head:Head whitespace ":-" whitespace body:Body "." {
    return {
      head,
      body
    };
  }

Head
  = functor:Atom "(" args:Arguments ")" {
    return head(functor, args);
  }

Body
  = Conjunction

Conjunction
  = ",(" first:Goals rest:( "," Goals )* ")" {
      return [first, ...rest.map(item => item[1])];
    }

Goals
  = Conjunction / Unify / Predicate / Condition

Unify
  = "=(" name:$(("_" / uppercase alnum*)) "," dataType:Argument ")" {
    return unify(dataType, name);
  }

Condition
  = operator:Operator "(" left:Argument "," right:Argument ")" {
    return condition(operator, left, right);
  }

Operator
  = "=<"

Predicate
  = name:Identifier "(" args:Arguments ")" {
    return predicate(name, args)
  }

Atom
  = value:$(("_" / lowercase alnum*)) { 
    return atom(value); 
  }

Variable
  = value:$(("_" / uppercase alnum*)) { 
    return variable(value); 
  }

Arguments
  = first:Argument rest:("," Argument)* {
    return [first, ...rest.map(item => item[1])];
  }

Argument
  = Atom / Variable / List

List
  = "[" elements:Elements "]" {
    return elements;
   }

Elements
  = head:Argument "|" tail:Argument {
    return list(head, tail);
  }

Identifier
  = value:$(letter alnum*) { 
    return value; 
  }

letter  
  = [a-zA-Z]

lowercase   
  = [a-z]

alnum   
  = [a-zA-Z0-9_]

uppercase   
  = [A-Z]

whitespace
  = [ \t\r\n]*