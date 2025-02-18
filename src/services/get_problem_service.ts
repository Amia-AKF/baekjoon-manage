import axios from "axios";
import { Problem_info } from "../types/problem";
import { Logger } from "../logger/logger";

export class Problem_service {
    constructor(private logger: Logger){}

    async fetchProblemData(problemNumber: string): Promise<Problem_info | null> {
        const options = {
            method: 'GET',
            url: 'https://solved.ac/api/v3/problem/show',
            params: { problemId: problemNumber },
            headers: { 'x-solvedac-language': 'ko', Accept: 'application/json' }
          };
        
          try {
            const { data } = await axios.request(options);
            return {
                title_ko: data.titleKo,
                level: data.level,
                problem_num: data.problemId
            };
          } catch (error) {
            this.logger.log(error, `Problem number: ${problemNumber}, solved.ac api error`);
            return null;
          }
    }
}