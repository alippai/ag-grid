import { CellClassParams, ColDef } from "../entities/colDef";
import { Autowired, Bean } from "../context/context";
import { ExpressionService } from "../valueService/expressionService";
import { BeanStub } from "../context/beanStub";
import { getAllKeysInObjects, isNonNullObject } from "../utils/object";
import { RowClassParams } from "../entities/gridOptions";

@Bean('stylingService')
export class StylingService extends BeanStub {

    @Autowired('expressionService') private expressionService: ExpressionService;

    public processAllCellClasses(colDef: ColDef, params: CellClassParams, onApplicableClass: (className: string) => void, onNotApplicableClass?: (className: string) => void) {
        this.processClassRules(colDef.cellClassRules, params, onApplicableClass, onNotApplicableClass);
        this.processStaticCellClasses(colDef, params, onApplicableClass);
    }

    public processClassRules(classRules: { [cssClassName: string]: (Function | string) } | undefined, params: RowClassParams | CellClassParams, onApplicableClass: (className: string) => void, onNotApplicableClass?: (className: string) => void) {
        if (classRules==null)  { return; }

        const classNames = Object.keys(classRules!);
        const classesToApply: {[name: string]: boolean} = {};
        const classesToRemove: {[name: string]: boolean} = {};

        for (let i = 0; i < classNames.length; i++) {
            const className = classNames[i];
            const rule = classRules![className];
            let resultOfRule: any;
            if (typeof rule === 'string') {
                resultOfRule = this.expressionService.evaluate(rule, params);
            } else if (typeof rule === 'function') {
                resultOfRule = rule(params);
            }

            // in case className = 'my-class1 my-class2', we need to split into individual class names
            className.split(' ').forEach( singleClass => {
                if (singleClass==null || singleClass.trim()=='') { return; }
                resultOfRule ? classesToApply[singleClass] = true : classesToRemove[singleClass] = true;
            });

            // we remove all classes first, then add all classes second,
            // in case a class appears in more than one rule, this means it will be added
            // if appears in at least one truthy rule
            if (onNotApplicableClass) {
                Object.keys(classesToRemove).forEach(onNotApplicableClass);
            }
            Object.keys(classesToApply).forEach(onApplicableClass);
        }
    }

    public processStaticCellClasses(colDef: ColDef, params: CellClassParams, onApplicableClass: (className: string) => void) {
        const cellClass = colDef.cellClass;
        if (cellClass) {
            let classOrClasses: any;

            if (typeof colDef.cellClass === 'function') {
                const cellClassFunc = colDef.cellClass as (cellClassParams: any) => string | string[];
                classOrClasses = cellClassFunc(params);
            } else {
                classOrClasses = colDef.cellClass;
            }

            if (typeof classOrClasses === 'string') {
                onApplicableClass(classOrClasses);
            } else if (Array.isArray(classOrClasses)) {
                classOrClasses.forEach((cssClassItem: string) => {
                    onApplicableClass(cssClassItem);
                });
            }
        }
    }

}
