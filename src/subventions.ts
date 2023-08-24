import { SubventionTable } from "./pubFunding.type"

export class subventions {
  public tabledatas:SubventionTable[]

  constructor(tableData:SubventionTable[] = []){
    this.tabledatas = tableData
  }


}