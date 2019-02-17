'use strict';

var Parser = require('expr-eval').Parser;

export class Expression {
    constructor(allowedOperators = []) {
        this.expressionString = '';
        this.allowedOperators = allowedOperators;
    }

    parse(expressionString) {
        // Make sure we have sane arguments.
        if (typeof expressionString != 'string') return;

        this.expressionString = expressionString;

        // Make sure all variables (and functions) are lower-case.
        this.expressionString = this.expressionString.toLowerCase();

        // Parse! Since Parser may throw errors, we need a try statement.
        try {
            // Special handling if we should restrict allowed operators.
            if (!this.allowedOperators.length) {
                return Parser.parse(this.expressionString);
            }

            return this.filterAllowedOperators();
        }
        catch(e) {
            return;
        }
    }

    filterAllowedOperators() {
        var expr = Parser.parse(this.expressionString);

        // Manipulate ops1, ops2 and functions of the expression object.
        for (var op in {ops1 : 'ops1', ops2 : 'ops2', functions : 'functions'}) {
            for (var i in expr[op]) {
                // Never remove the negative sign as operator.
                if (op == 'ops1' && i == '-') {
                    continue;
                }
                if (this.allowedOperators.indexOf(i) < 0) {
                    // We cannot delete the function, since it not a property. Instead we
                    // set it to something awkward, which will fail evaluation if the
                    // function is used.
                    expr[op][i] = undefined;
                }
            }
        }
        return expr;
    }
}


